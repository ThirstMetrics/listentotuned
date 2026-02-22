/**
 * Tuned Podcast Player - Podcast Domain Types
 */

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Podcast
// ---------------------------------------------------------------------------

export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  feedUrl: string;
  categories: Category[];
  episodeCount: number;
  lastEpisodeDate: string | null;
  language: string;
  explicit: boolean;
  websiteUrl: string | null;
  /** Average rating (1-5) */
  rating: number | null;
  /** Total number of ratings */
  ratingCount: number;
}

// ---------------------------------------------------------------------------
// Episode
// ---------------------------------------------------------------------------

export interface Episode {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  pubDate: string;
  /** Duration in seconds */
  duration: number;
  audioUrl: string;
  artworkUrl: string | null;
  isPlayed: boolean;
  /** Playback position in seconds (for resume) */
  playPosition: number;
  /** File size in bytes */
  fileSize: number | null;
  /** Season number if applicable */
  season: number | null;
  /** Episode number if applicable */
  episodeNumber: number | null;
  /** MIME type of the audio file */
  mimeType: string;
  /** Whether the episode contains explicit content */
  explicit: boolean;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  podcast: Podcast;
  /** Relevance score from 0 to 1 */
  relevanceScore: number;
}
