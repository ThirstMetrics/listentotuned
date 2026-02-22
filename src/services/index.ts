/**
 * Tuned Podcast Player - Service Layer
 *
 * Re-exports all services from a single entry point.
 *
 * Usage:
 *   import { authService, podcastIndexService } from '../services';
 */

// HTTP client & token helpers
export { apiClient, setAuthToken, setRefreshToken, clearTokens } from './apiClient';

// Podcast Index API
export { podcastIndexService } from './podcastIndexService';

// RSS feed parser
export { feedService } from './feedService';
export type { ParsedFeed } from './feedService';

// Firebase authentication
export { authService } from './authService';
export type { AuthResult, AuthError } from './authService';

// Episode download manager
export { downloadService } from './downloadService';
export type { DownloadProgress, DownloadStatus, ProgressCallback } from './downloadService';

// Analytics / event tracking
export { analyticsService } from './analyticsService';
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  ConnectionType,
  AppContext,
} from './analyticsService';
