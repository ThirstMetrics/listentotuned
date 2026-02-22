import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../server';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/users/register
// Create user profile after Firebase auth
// ---------------------------------------------------------------------------
router.post('/register', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { displayName, avatarUrl } = req.body;

    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name, avatar_url, tier, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'free', NOW(), NOW())
       ON CONFLICT (firebase_uid)
       DO UPDATE SET email = COALESCE($2, users.email),
                     display_name = COALESCE($3, users.display_name),
                     updated_at = NOW()
       RETURNING *`,
      [authReq.user.uid, authReq.user.email || null, displayName || null, avatarUrl || null]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/me
// Get current user profile
// ---------------------------------------------------------------------------
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const result = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [authReq.user.uid]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User profile not found. Please register first.' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/users/me
// Update current user profile
// ---------------------------------------------------------------------------
router.put('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { displayName, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE firebase_uid = $1
       RETURNING *`,
      [authReq.user.uid, displayName || null, avatarUrl || null]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/me/subscriptions
// Get user's podcast subscriptions
// ---------------------------------------------------------------------------
router.get('/me/subscriptions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const result = await pool.query(
      `SELECT p.*, s.subscribed_at, s.notifications_enabled
       FROM subscriptions s
       INNER JOIN podcasts p ON p.id = s.podcast_id
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.firebase_uid = $1
       ORDER BY s.subscribed_at DESC`,
      [authReq.user.uid]
    );

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/users/me/subscriptions
// Add a podcast subscription
// ---------------------------------------------------------------------------
router.post('/me/subscriptions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { podcastId, notificationsEnabled } = req.body;

    if (!podcastId) {
      res.status(400).json({ error: 'podcastId is required' });
      return;
    }

    // Resolve user id
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
      `INSERT INTO subscriptions (user_id, podcast_id, subscribed_at, notifications_enabled)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (user_id, podcast_id) DO NOTHING
       RETURNING *`,
      [userId, podcastId, notificationsEnabled ?? true]
    );

    if (result.rows.length === 0) {
      res.json({ message: 'Already subscribed' });
      return;
    }

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/users/me/subscriptions/:podcastId
// Remove a podcast subscription
// ---------------------------------------------------------------------------
router.delete('/me/subscriptions/:podcastId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { podcastId } = req.params;

    const result = await pool.query(
      `DELETE FROM subscriptions
       WHERE podcast_id = $1
         AND user_id = (SELECT id FROM users WHERE firebase_uid = $2)
       RETURNING *`,
      [podcastId, authReq.user.uid]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/me/history
// Get listening history
// ---------------------------------------------------------------------------
router.get('/me/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const result = await pool.query(
      `SELECT lh.*, e.title AS episode_title, e.audio_url, e.artwork_url AS episode_artwork,
              p.title AS podcast_title, p.artwork_url AS podcast_artwork
       FROM listen_history lh
       INNER JOIN episodes e ON e.id = lh.episode_id
       INNER JOIN podcasts p ON p.id = e.podcast_id
       INNER JOIN users u ON u.id = lh.user_id
       WHERE u.firebase_uid = $1
       ORDER BY lh.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [authReq.user.uid, limit, offset]
    );

    res.json({ data: result.rows, pagination: { limit, offset } });
  } catch (err) {
    next(err);
  }
});

export default router;
