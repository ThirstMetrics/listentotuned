import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../server';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/analytics/events
// Record an analytics event
// ---------------------------------------------------------------------------
router.post('/events', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventType, metadata } = req.body;

    if (!eventType || typeof eventType !== 'string') {
      res.status(400).json({ error: 'eventType is required' });
      return;
    }

    // For now, log the event. In production this would forward to Azure Event Hubs.
    console.log(`[Analytics] user=${authReq.user.uid} event=${eventType}`, metadata);

    res.status(202).json({ message: 'Event recorded' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/analytics/stats
// Get basic listening stats for the authenticated user
// ---------------------------------------------------------------------------
router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const result = await pool.query(
      `SELECT
         COUNT(*) AS total_episodes,
         COUNT(*) FILTER (WHERE completed = true) AS completed_episodes,
         COALESCE(SUM(position), 0) AS total_listen_seconds
       FROM listen_history lh
       INNER JOIN users u ON u.id = lh.user_id
       WHERE u.firebase_uid = $1`,
      [authReq.user.uid]
    );

    const stats = result.rows[0];

    res.json({
      data: {
        totalEpisodes: parseInt(stats.total_episodes, 10),
        completedEpisodes: parseInt(stats.completed_episodes, 10),
        totalListenSeconds: parseInt(stats.total_listen_seconds, 10),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
