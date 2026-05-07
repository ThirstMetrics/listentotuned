import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../server';
import { PodcastIndexService } from '../services/podcastIndexService';

const router = Router();
const podcastIndex = new PodcastIndexService();

// ---------------------------------------------------------------------------
// GET /api/podcasts/search?q=query
// Search podcasts via Podcast Index API
// ---------------------------------------------------------------------------
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string | undefined;
    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const results = await podcastIndex.search(query.trim());
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/podcasts/trending
// Get trending podcasts
// ---------------------------------------------------------------------------
router.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const max = parseInt((req.query.max as string) || '20', 10);
    const lang = (req.query.lang as string) || 'en';
    const category = req.query.category as string | undefined;

    const results = await podcastIndex.getTrending(max, lang, category);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/podcasts/categories
// Get all podcast categories
// ---------------------------------------------------------------------------
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!pool) {
      res.json({ data: [] });
      return;
    }
    const result = await pool.query(
      `SELECT DISTINCT unnest(categories) AS category FROM podcasts ORDER BY category`
    );
    const categories = result.rows.map((row) => row.category);
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/podcasts/:id
// Get podcast details
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try local database first (may fail if id format mismatches schema)
    if (pool) {
      try {
        const dbResult = await pool.query('SELECT * FROM podcasts WHERE id = $1', [id]);
        if (dbResult.rows.length > 0) {
          res.json({ data: dbResult.rows[0] });
          return;
        }
      } catch {
        // DB lookup failed (e.g. numeric id vs UUID column) — fall through to Podcast Index
      }
    }

    // Fall back to Podcast Index
    const podcast = await podcastIndex.getPodcastById(parseInt(id, 10));
    if (!podcast) {
      res.status(404).json({ error: 'Podcast not found' });
      return;
    }

    res.json({ data: podcast });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/podcasts/:id/episodes
// Get episodes for a podcast
// ---------------------------------------------------------------------------
router.get('/:id/episodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    // Try local database first (may fail if id format mismatches schema)
    if (pool) {
      try {
        const dbResult = await pool.query(
          `SELECT * FROM episodes
           WHERE podcast_id = $1
           ORDER BY pub_date DESC
           LIMIT $2 OFFSET $3`,
          [id, limit, offset]
        );

        if (dbResult.rows.length > 0) {
          res.json({ data: dbResult.rows, pagination: { limit, offset } });
          return;
        }
      } catch {
        // DB lookup failed — fall through to Podcast Index
      }
    }

    // Fall back to Podcast Index
    const episodes = await podcastIndex.getEpisodesByFeedId(parseInt(id, 10));
    res.json({ data: episodes, pagination: { limit, offset } });
  } catch (err) {
    next(err);
  }
});

export default router;
