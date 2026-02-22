import { Router, Request, Response } from 'express';
import { pool } from '../server';
import { redis } from '../server';

const router = Router();

const APP_VERSION = process.env.npm_package_version || '1.0.0';

// ---------------------------------------------------------------------------
// GET /api/health
// Returns service health status
// ---------------------------------------------------------------------------
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // Check PostgreSQL
  if (pool) {
    try {
      await pool.query('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }
  } else {
    checks.postgres = 'not configured';
  }

  // Check Redis
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }
  } else {
    checks.redis = 'not configured';
  }

  const allHealthy = Object.values(checks).every(
    (v) => v === 'ok' || v === 'not configured',
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    checks,
  });
});

export default router;
