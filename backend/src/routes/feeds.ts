import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../server';
import { redis } from '../server';
import { requireAuth } from '../middleware/auth';
import { FeedPollingService } from '../services/feedPollingService';

const router = Router();
const feedPolling = new FeedPollingService();

// ---------------------------------------------------------------------------
// POST /api/feeds/parse
// Parse an RSS feed URL and return podcast + episodes
// ---------------------------------------------------------------------------
router.post('/parse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Feed URL is required' });
      return;
    }

    const feedData = await feedPolling.pollFeed(url);
    res.json({ data: feedData });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/feeds/subscribe
// Add a feed to the polling schedule
// ---------------------------------------------------------------------------
router.post('/subscribe', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { feedUrl, title, author, description, artworkUrl } = req.body;

    if (!feedUrl || typeof feedUrl !== 'string') {
      res.status(400).json({ error: 'feedUrl is required' });
      return;
    }

    // Upsert the podcast into the database
    const podcastResult = await pool.query(
      `INSERT INTO podcasts (feed_url, title, author, description, artwork_url, poll_interval_minutes)
       VALUES ($1, $2, $3, $4, $5, 60)
       ON CONFLICT (feed_url)
       DO UPDATE SET title = COALESCE($2, podcasts.title),
                     author = COALESCE($3, podcasts.author),
                     description = COALESCE($4, podcasts.description),
                     artwork_url = COALESCE($5, podcasts.artwork_url)
       RETURNING *`,
      [feedUrl, title || null, author || null, description || null, artworkUrl || null]
    );

    const podcast = podcastResult.rows[0];

    // Register feed in Redis polling schedule
    await redis.hset('feed:schedule', feedUrl, JSON.stringify({
      podcastId: podcast.id,
      pollIntervalMinutes: podcast.poll_interval_minutes,
      lastPolledAt: podcast.last_polled_at,
      etag: podcast.etag,
      lastModified: podcast.last_modified,
    }));

    res.status(201).json({ data: podcast });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/feeds/:feedId
// Remove feed from polling schedule
// ---------------------------------------------------------------------------
router.delete('/:feedId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { feedId } = req.params;

    // Get the feed URL so we can remove from Redis
    const podcastResult = await pool.query('SELECT feed_url FROM podcasts WHERE id = $1', [feedId]);

    if (podcastResult.rows.length === 0) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }

    const feedUrl = podcastResult.rows[0].feed_url;

    // Check if any other users are subscribed to this feed
    const subCount = await pool.query(
      'SELECT COUNT(*) AS count FROM subscriptions WHERE podcast_id = $1',
      [feedId]
    );

    if (parseInt(subCount.rows[0].count, 10) === 0) {
      // No subscribers -- remove from polling schedule
      await redis.hdel('feed:schedule', feedUrl);
    }

    res.json({ message: 'Feed removed from polling schedule' });
  } catch (err) {
    next(err);
  }
});

export default router;
