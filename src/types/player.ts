/**
 * Tuned Podcast Player - Player Domain Types
 */

import type { Episode, Podcast } from './podcast';

// ---------------------------------------------------------------------------
// Playback State
// ---------------------------------------------------------------------------

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error';

// ---------------------------------------------------------------------------
// Repeat Mode
// ---------------------------------------------------------------------------

export type RepeatMode = 'off' | 'one' | 'all';

// ---------------------------------------------------------------------------
// Queue Item
// ---------------------------------------------------------------------------

export interface QueueItem {
  episode: Episode;
  /** Subset of podcast info needed for display in the player UI */
  podcastTitle: string;
  podcastAuthor: string;
  podcastArtworkUrl: string;
}

// ---------------------------------------------------------------------------
// Player Progress
// ---------------------------------------------------------------------------

export interface PlayerProgress {
  /** Current playback position in seconds */
  position: number;
  /** Total duration in seconds */
  duration: number;
  /** Buffered amount in seconds */
  buffered: number;
}

// ---------------------------------------------------------------------------
// Sleep Timer
// ---------------------------------------------------------------------------

export interface SleepTimer {
  /** Minutes remaining (null if not set) */
  minutes: number | null;
  /** Timestamp when the timer ends (null if not set) */
  endsAt: number | null;
}
