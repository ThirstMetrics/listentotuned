import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import Redis from 'ioredis';
import admin from 'firebase-admin';

import config from './config/index';
import app from './app';

// ---------------------------------------------------------------------------
// PostgreSQL connection pool (optional in dev)
// ---------------------------------------------------------------------------
export let pool: Pool | null = null;

if (config.databaseUrl) {
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.isProduction ? { rejectUnauthorized: true } : undefined,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Redis client (optional in dev)
// ---------------------------------------------------------------------------
export let redis: Redis | null = null;

if (config.redisUrl) {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5_000);
      return delay;
    },
    lazyConnect: true,
  });
}

// ---------------------------------------------------------------------------
// Firebase Admin SDK (optional in dev)
// ---------------------------------------------------------------------------
function initializeFirebase(): void {
  if (
    !config.firebase.projectId ||
    !config.firebase.privateKey ||
    !config.firebase.clientEmail
  ) {
    console.log('[Firebase] Skipped — credentials not configured');
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });
    console.log('[Firebase] Admin SDK initialized');
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  if (pool) {
    try {
      await pool.end();
      console.log('[PostgreSQL] Connection pool closed');
    } catch (err) {
      console.error('[PostgreSQL] Error closing pool:', err);
    }
  }

  if (redis) {
    try {
      redis.disconnect();
      console.log('[Redis] Disconnected');
    } catch (err) {
      console.error('[Redis] Error disconnecting:', err);
    }
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    // Connect to PostgreSQL (if configured)
    if (pool) {
      const pgClient = await pool.connect();
      console.log('[PostgreSQL] Connected to database');
      pgClient.release();
    } else {
      console.log('[PostgreSQL] Skipped — DATABASE_URL not configured');
    }

    // Connect to Redis (if configured)
    if (redis) {
      await redis.connect();
      console.log('[Redis] Connected');
    } else {
      console.log('[Redis] Skipped — REDIS_URL not configured');
    }

    // Initialize Firebase (if configured)
    initializeFirebase();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`[Server] Tuned API running on port ${config.port} (${config.nodeEnv})`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: unknown) => {
      console.error('[Server] Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('[Server] Uncaught exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

main();
