import dotenv from 'dotenv';

dotenv.config();

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

const isProduction = optionalEnv('NODE_ENV', 'development') === 'production';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (isProduction) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return '';
  }
  return value;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isProduction,

  // Azure PostgreSQL
  databaseUrl: requireEnv('DATABASE_URL'),

  // Azure Redis
  redisUrl: requireEnv('REDIS_URL'),

  // Podcast Index API
  podcastIndex: {
    key: requireEnv('PODCAST_INDEX_KEY'),
    secret: requireEnv('PODCAST_INDEX_SECRET'),
    baseUrl: 'https://api.podcastindex.org/api/1.0',
  },

  // Firebase Admin SDK
  firebase: {
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
  },

  // Azure Event Hubs (analytics)
  azure: {
    eventHubsConnectionString: optionalEnv('AZURE_EVENT_HUBS_CONNECTION_STRING', ''),
  },
} as const;

export type Config = typeof config;
export default config;
