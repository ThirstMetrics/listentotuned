/**
 * Tuned Podcast Player - Analytics Service
 *
 * Collects playback and interaction events for the creator analytics pipeline.
 * Events are batched locally and flushed to the Azure Event Hubs endpoint
 * periodically (every 30 s) or when the batch exceeds 50 events.
 *
 * Offline support: unsent events are persisted to MMKV storage so they survive
 * app restarts and are retried on the next flush cycle.
 *
 * Privacy: the device identifier is hashed before transmission, and all tracking
 * respects the user's opt-in preference stored in MMKV.
 */

import { createMMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const storage = createMMKV({ id: 'tuned-analytics' });

const PENDING_EVENTS_KEY = 'pending_events';
const DEVICE_ID_KEY = 'hashed_device_id';
const OPT_IN_KEY = 'analytics_opt_in';

// ---------------------------------------------------------------------------
// Event Schema
// ---------------------------------------------------------------------------

export type AnalyticsEventType =
  | 'listen_progress'
  | 'skip'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'share'
  | 'show_notes_tap';

export type ConnectionType = 'wifi' | 'cellular' | 'offline_sync';

export interface AppContext {
  discovery_source: string;
  queue_position: number;
}

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  hashed_device_id: string;
  show_id: string;
  episode_id: string;
  timestamp_utc: string;
  position_seconds: number;
  episode_duration_seconds: number;
  playback_speed: number;
  connection_type: ConnectionType;
  approximate_geo: string;
  app_context: AppContext;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Flush the batch when it exceeds this many events. */
const MAX_BATCH_SIZE = 50;

/** Flush interval in milliseconds. */
const FLUSH_INTERVAL_MS = 30_000;

/** Azure Event Hubs ingest path (relative to apiClient baseURL). */
const EVENTS_ENDPOINT = '/analytics/events';

// ---------------------------------------------------------------------------
// Device ID Hashing
// ---------------------------------------------------------------------------

/**
 * Produce a simple but consistent hash of the raw device identifier.
 * Uses a DJB2-style hash converted to hex. This is NOT cryptographic but is
 * sufficient for de-identifying a device ID for analytics purposes.
 */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  // Convert to unsigned 32-bit hex.
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Return a hashed device identifier. Generates once and caches in MMKV.
 */
function getHashedDeviceId(): string {
  const cached = storage.getString(DEVICE_ID_KEY);
  if (cached) return cached;

  // Build a raw identifier from platform constants.
  const raw = [
    Platform.OS,
    Platform.Version,
    // Add a random component so the hash is unique per install.
    Math.random().toString(36).slice(2),
    Date.now().toString(36),
  ].join('-');

  const hashed = hashString(raw);
  storage.set(DEVICE_ID_KEY, hashed);
  return hashed;
}

// ---------------------------------------------------------------------------
// Opt-In Check
// ---------------------------------------------------------------------------

function isOptedIn(): boolean {
  // Default to opted-in; users can toggle off in Settings.
  return storage.getBoolean(OPT_IN_KEY) ?? true;
}

function setOptIn(value: boolean): void {
  storage.set(OPT_IN_KEY, value);
}

// ---------------------------------------------------------------------------
// Event Queue
// ---------------------------------------------------------------------------

let eventBatch: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** Load any persisted events that were not yet flushed (e.g. after a crash). */
function loadPersisted(): void {
  try {
    const raw = storage.getString(PENDING_EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnalyticsEvent[];
      if (Array.isArray(parsed)) {
        eventBatch = [...parsed, ...eventBatch];
      }
    }
  } catch {
    // Corrupt data -- discard.
    storage.remove(PENDING_EVENTS_KEY);
  }
}

/** Persist the current batch to MMKV for crash-safety. */
function persistBatch(): void {
  try {
    if (eventBatch.length > 0) {
      storage.set(PENDING_EVENTS_KEY, JSON.stringify(eventBatch));
    } else {
      storage.remove(PENDING_EVENTS_KEY);
    }
  } catch {
    // Silently fail -- analytics should never crash the app.
  }
}

// ---------------------------------------------------------------------------
// Flush
// ---------------------------------------------------------------------------

/**
 * Send all queued events to the Azure Event Hubs endpoint.
 * On success, clears the persisted queue. On failure, events remain in the
 * batch for the next attempt.
 */
async function flushEvents(): Promise<void> {
  if (eventBatch.length === 0) return;
  if (!isOptedIn()) {
    // User opted out -- discard all queued events.
    eventBatch = [];
    persistBatch();
    return;
  }

  // Take a snapshot so new events added during the network call are preserved.
  const toSend = [...eventBatch];
  eventBatch = [];

  try {
    await apiClient.post(EVENTS_ENDPOINT, { events: toSend });
    // Success -- clear persisted queue.
    persistBatch();
  } catch {
    // Put events back for retry on next flush.
    eventBatch = [...toSend, ...eventBatch];
    persistBatch();
  }
}

// ---------------------------------------------------------------------------
// Track Event
// ---------------------------------------------------------------------------

/**
 * Record an analytics event. The event is queued and flushed asynchronously.
 *
 * If the user has opted out of analytics, the event is silently discarded.
 */
function trackEvent(
  event: Omit<AnalyticsEvent, 'hashed_device_id' | 'timestamp_utc'> & {
    hashed_device_id?: string;
    timestamp_utc?: string;
  },
): void {
  if (!isOptedIn()) return;

  const fullEvent: AnalyticsEvent = {
    ...event,
    hashed_device_id: event.hashed_device_id || getHashedDeviceId(),
    timestamp_utc: event.timestamp_utc || new Date().toISOString(),
  };

  eventBatch.push(fullEvent);
  persistBatch();

  // Flush immediately if batch size threshold reached.
  if (eventBatch.length >= MAX_BATCH_SIZE) {
    flushEvents();
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Initialise the analytics service. Call once at app startup.
 * Restores any persisted events and starts the flush timer.
 */
function init(): void {
  loadPersisted();

  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL_MS);
}

/**
 * Tear down the analytics service. Flushes remaining events and stops the timer.
 * Call during app shutdown or in test teardown.
 */
async function destroy(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushEvents();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const analyticsService = {
  init,
  destroy,
  trackEvent,
  flushEvents,
  setOptIn,
  isOptedIn,
  getHashedDeviceId,
};

export default analyticsService;
