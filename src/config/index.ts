/**
 * App configuration
 * In production, sensitive values should come from environment/secrets management
 */

const Config = {
  // App
  APP_NAME: 'Tuned',
  APP_VERSION: '1.0.0',
  APP_TAGLINE: 'Stay tuned.',

  // API
  API_BASE_URL: __DEV__
    ? 'http://localhost:3000/api'
    : 'https://api.gettuned.app/api',
  API_TIMEOUT: 15000,

  // Podcast Index API (free, primary data source)
  PODCAST_INDEX_BASE_URL: 'https://api.podcastindex.org/api/1.0',
  PODCAST_INDEX_KEY: '', // Set via environment
  PODCAST_INDEX_SECRET: '', // Set via environment

  // Firebase
  FIREBASE_WEB_CLIENT_ID: '', // Set via GoogleService-Info.plist / google-services.json

  // Analytics
  ANALYTICS_BATCH_SIZE: 50,
  ANALYTICS_FLUSH_INTERVAL_MS: 30000, // 30 seconds

  // Playback defaults
  DEFAULT_SKIP_FORWARD_SECONDS: 30,
  DEFAULT_SKIP_BACKWARD_SECONDS: 15,
  DEFAULT_PLAYBACK_SPEED: 1.0,

  // Downloads
  MAX_CONCURRENT_DOWNLOADS: 3,
  DOWNLOAD_DIRECTORY: 'episodes',

  // Cache
  FEED_CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes
  IMAGE_CACHE_SIZE_MB: 200,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  SEARCH_RESULTS_LIMIT: 30,

  // Deep linking
  URL_SCHEME: 'tuned',
  WEB_DOMAIN: 'gettuned.app',
} as const;

export default Config;
