/**
 * Tuned Podcast Player - User Domain Types
 */

// ---------------------------------------------------------------------------
// User Tier
// ---------------------------------------------------------------------------

export type UserTier = 'free' | 'premium' | 'pro';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  tier: UserTier;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export interface Subscription {
  podcastId: string;
  subscribedAt: string;
  notificationsEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Listen History
// ---------------------------------------------------------------------------

export interface ListenHistory {
  episodeId: string;
  podcastId: string;
  /** Playback position in seconds */
  position: number;
  /** Total episode duration in seconds */
  duration: number;
  /** ISO date string when episode was completed (null if not yet completed) */
  completedAt: string | null;
  /** ISO date string when this entry was last updated */
  listenedAt: string;
}
