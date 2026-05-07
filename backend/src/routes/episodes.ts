import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../server';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/episodes/recent
// Get recent episodes from user's subscriptions (requires auth)
// ---------------------------------------------------------------------------
router.get('/recent', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!pool) {
      res.json({ data: [], pagination: { limit: 50, offset: 0 } });
      return;
    }
    const authReq = req as AuthenticatedRequest;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const result = await pool.query(
      `SELECT e.*
       FROM episodes e
       INNER JOIN subscriptions s ON s.podcast_id = e.podcast_id
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.firebase_uid = $1
       ORDER BY e.pub_date DESC
       LIMIT $2 OFFSET $3`,
      [authReq.user.uid, limit, offset]
    );

    res.json({ data: result.rows, pagination: { limit, offset } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/episodes/:id
// Get episode details
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!pool) {
      res.status(404).json({ error: 'Episode not found (database not configured)' });
      return;
    }
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/episodes/:id/progress
// Save listen progress (position, duration)
// ---------------------------------------------------------------------------
router.post('/:id/progress', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const episodeId = req.params.id;
    const { position, duration } = req.body;

    if (typeof position !== 'number' || typeof duration !== 'number') {
      res.status(400).json({ error: 'position and duration are required as numbers' });
      return;
    }

    const completed = duration > 0 && position / duration >= 0.95;

    if (!pool) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    // Resolve internal user id from firebase_uid
    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [authReq.user.uid]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO listen_history (user_id, episode_id, position, duration, completed, listened_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id, episode_id)
       DO UPDATE SET position = $3, duration = $4, completed = $5, updated_at = NOW()
       RETURNING *`,
      [userId, episodeId, position, duration, completed]
    );

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/episodes/:id/progress
// Get listen progress for an episode
// ---------------------------------------------------------------------------
router.get('/:id/progress', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const episodeId = req.params.id;

    if (!pool) {
      res.json({ data: null });
      return;
    }

    const result = await pool.query(
      `SELECT lh.*
       FROM listen_history lh
       INNER JOIN users u ON u.id = lh.user_id
       WHERE u.firebase_uid = $1 AND lh.episode_id = $2`,
      [authReq.user.uid, episodeId]
    );

    if (result.rows.length === 0) {
      res.json({ data: null });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
