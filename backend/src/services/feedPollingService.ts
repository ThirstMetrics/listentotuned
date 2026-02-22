import axios from 'axios';
import Parser from 'rss-parser';
import { redis } from '../server';
import { pool } from '../server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ParsedFeed {
  title: string;
  description: string;
  link: string;
  image: string;
  author: string;
  episodes: ParsedEpisode[];
}

interface ParsedEpisode {
  guid: string;
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  image: string;
  fileSize: number;
  season: number | null;
  episodeNumber: number | null;
}

interface FeedMeta {
  etag: string | null;
  lastModified: string | null;
  lastPolledAt: string;
  pollIntervalMinutes: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MIN_POLL_INTERVAL = 15;      // minutes
const MAX_POLL_INTERVAL = 1440;    // 24 hours in minutes
const DEFAULT_POLL_INTERVAL = 60;  // 1 hour

// ---------------------------------------------------------------------------
// Feed Polling Service
// ---------------------------------------------------------------------------
export class FeedPollingService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 30_000,
      headers: {
        'User-Agent': 'TunedPodcastPlayer/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      customFields: {
        item: [
          ['itunes:duration', 'itunesDuration'],
          ['itunes:image', 'itunesImage'],
          ['itunes:season', 'itunesSeason'],
          ['itunes:episode', 'itunesEpisode'],
        ],
      },
    });
  }

  /**
   * Poll a single feed URL. Uses conditional HTTP requests (ETag /
   * If-Modified-Since) when possible to minimise bandwidth.
   *
   * Returns the parsed feed data, or null if the feed has not changed.
   */
  async pollFeed(feedUrl: string): Promise<ParsedFeed | null> {
    const redisKey = `feed:meta:${feedUrl}`;
    const cached = await redis.get(redisKey);
    const meta: FeedMeta | null = cached ? JSON.parse(cached) : null;

    // Build conditional request headers
    const headers: Record<string, string> = {
      'User-Agent': 'TunedPodcastPlayer/1.0',
      Accept: 'application/rss+xml, application/xml, text/xml',
    };

    if (meta?.etag) {
      headers['If-None-Match'] = meta.etag;
    }
    if (meta?.lastModified) {
      headers['If-Modified-Since'] = meta.lastModified;
    }

    // Fetch the feed
    let response;
    try {
      response = await axios.get(feedUrl, {
        headers,
        timeout: 30_000,
        responseType: 'text',
        validateStatus: (status) => status < 500,
      });
    } catch (err) {
      console.error(`[FeedPolling] Error fetching ${feedUrl}:`, err);
      throw err;
    }

    // 304 Not Modified -- feed hasn't changed
    if (response.status === 304) {
      await this.updateMeta(redisKey, meta!, { lastPolledAt: new Date().toISOString() });
      return null;
    }

    if (response.status !== 200) {
      console.warn(`[FeedPolling] Unexpected status ${response.status} for ${feedUrl}`);
      return null;
    }

    // Parse the RSS XML
    const feed = await this.parser.parseString(response.data as string);

    // Extract episodes
    const episodes: ParsedEpisode[] = (feed.items ?? []).map((item) => {
      const enclosure = item.enclosure;
      return {
        guid: item.guid || item.link || item.title || '',
        title: item.title || '',
        description: item.contentSnippet || item.content || '',
        pubDate: item.pubDate || item.isoDate || '',
        duration: (item as Record<string, unknown>).itunesDuration as string || '',
        audioUrl: enclosure?.url || '',
        image: this.extractImage(item) || '',
        fileSize: enclosure?.length ? parseInt(String(enclosure.length), 10) : 0,
        season: this.parseOptionalInt((item as Record<string, unknown>).itunesSeason as string),
        episodeNumber: this.parseOptionalInt((item as Record<string, unknown>).itunesEpisode as string),
      };
    });

    // Build parsed feed result
    const parsedFeed: ParsedFeed = {
      title: feed.title || '',
      description: feed.description || '',
      link: feed.link || feedUrl,
      image: feed.image?.url || feed.itunes?.image || '',
      author: feed.itunes?.author || feed.creator || '',
      episodes,
    };

    // Update cached metadata
    const newMeta: FeedMeta = {
      etag: (response.headers['etag'] as string) || null,
      lastModified: (response.headers['last-modified'] as string) || null,
      lastPolledAt: new Date().toISOString(),
      pollIntervalMinutes: this.calculatePollInterval(episodes),
    };

    await redis.set(redisKey, JSON.stringify(newMeta), 'EX', 86_400); // expire in 24h

    return parsedFeed;
  }

  /**
   * Persist new episodes to the database if they don't already exist.
   */
  async storeNewEpisodes(podcastId: string, episodes: ParsedEpisode[]): Promise<number> {
    let newCount = 0;

    for (const ep of episodes) {
      const result = await pool.query(
        `INSERT INTO episodes (podcast_id, guid, title, description, pub_date, duration, audio_url, artwork_url, file_size, season, episode_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (podcast_id, guid) DO NOTHING
         RETURNING id`,
        [
          podcastId,
          ep.guid,
          ep.title,
          ep.description,
          ep.pubDate ? new Date(ep.pubDate) : null,
          ep.duration,
          ep.audioUrl,
          ep.image,
          ep.fileSize,
          ep.season,
          ep.episodeNumber,
        ]
      );

      if (result.rows.length > 0) {
        newCount++;
      }
    }

    return newCount;
  }

  /**
   * Calculate adaptive polling interval based on episode frequency.
   * Active feeds (recent episodes) get polled more often; inactive feeds
   * are polled less frequently.
   */
  private calculatePollInterval(episodes: ParsedEpisode[]): number {
    if (episodes.length === 0) {
      return MAX_POLL_INTERVAL;
    }

    // Find the most recent episode
    const dates = episodes
      .map((ep) => (ep.pubDate ? new Date(ep.pubDate).getTime() : 0))
      .filter((d) => d > 0)
      .sort((a, b) => b - a);

    if (dates.length === 0) {
      return DEFAULT_POLL_INTERVAL;
    }

    const latestEpisodeAge = Date.now() - dates[0];
    const hoursAgo = latestEpisodeAge / (1000 * 60 * 60);

    // Episode published in last 24h -> poll every 15 min
    if (hoursAgo < 24) {
      return MIN_POLL_INTERVAL;
    }

    // Episode published in last 7 days -> poll every hour
    if (hoursAgo < 168) {
      return 60;
    }

    // Episode published in last 30 days -> poll every 6 hours
    if (hoursAgo < 720) {
      return 360;
    }

    // Older -> poll every 24 hours
    return MAX_POLL_INTERVAL;
  }

  /**
   * Merge partial updates into existing meta.
   */
  private async updateMeta(
    redisKey: string,
    existing: FeedMeta,
    updates: Partial<FeedMeta>
  ): Promise<void> {
    const merged: FeedMeta = { ...existing, ...updates };
    await redis.set(redisKey, JSON.stringify(merged), 'EX', 86_400);
  }

  /**
   * Extract episode image from various RSS formats.
   */
  private extractImage(item: Record<string, unknown>): string {
    const itunesImage = item.itunesImage;
    if (typeof itunesImage === 'string') return itunesImage;
    if (itunesImage && typeof itunesImage === 'object') {
      const img = itunesImage as Record<string, unknown>;
      if (typeof img.href === 'string') return img.href;
      if (typeof img['$'] === 'object') {
        const attrs = img['$'] as Record<string, string>;
        if (attrs.href) return attrs.href;
      }
    }
    return '';
  }

  /**
   * Safely parse a string to an integer, returning null if invalid.
   */
  private parseOptionalInt(value: string | undefined | null): number | null {
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
}
