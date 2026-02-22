/**
 * Tuned Podcast Player - RSS Feed Parser Service
 *
 * Uses `rss-parser` to fetch and parse podcast RSS/XML feeds.
 * Extracts standard RSS elements plus iTunes namespace extensions
 * (itunes:author, itunes:image, itunes:duration, itunes:summary, itunes:explicit).
 *
 * Includes an in-memory cache with a configurable TTL to avoid redundant fetches.
 */

import Parser from 'rss-parser';
import type { Podcast, Episode, Category } from '../types/podcast';

// ---------------------------------------------------------------------------
// Custom RSS Parser - Include iTunes Namespace Fields
// ---------------------------------------------------------------------------

/**
 * rss-parser supports custom fields via the `customFields` option.
 * We request common iTunes-namespace attributes that standard RSS omits.
 */
type CustomFeed = {
  'itunes:author'?: string;
  'itunes:image'?: { $: { href: string } } | string;
  'itunes:summary'?: string;
  'itunes:explicit'?: string;
  'itunes:category'?: Array<{ $: { text: string } }> | { $: { text: string } };
  language?: string;
  link?: string;
};

type CustomItem = {
  'itunes:duration'?: string;
  'itunes:summary'?: string;
  'itunes:explicit'?: string;
  'itunes:image'?: { $: { href: string } } | string;
  'itunes:season'?: string;
  'itunes:episode'?: string;
  'itunes:author'?: string;
  enclosure?: {
    url: string;
    length?: string;
    type?: string;
  };
};

const parser = new Parser<CustomFeed, CustomItem>({
  customFields: {
    feed: [
      ['itunes:author', 'itunes:author'],
      ['itunes:image', 'itunes:image'],
      ['itunes:summary', 'itunes:summary'],
      ['itunes:explicit', 'itunes:explicit'],
      ['itunes:category', 'itunes:category'],
    ],
    item: [
      ['itunes:duration', 'itunes:duration'],
      ['itunes:summary', 'itunes:summary'],
      ['itunes:explicit', 'itunes:explicit'],
      ['itunes:image', 'itunes:image'],
      ['itunes:season', 'itunes:season'],
      ['itunes:episode', 'itunes:episode'],
      ['itunes:author', 'itunes:author'],
    ],
  },
  timeout: 15_000,
});

// ---------------------------------------------------------------------------
// In-Memory Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  podcast: Podcast;
  episodes: Episode[];
  cachedAt: number;
}

/** Default TTL: 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

const feedCache = new Map<string, CacheEntry>();

function getCached(feedUrl: string): CacheEntry | null {
  const entry = feedCache.get(feedUrl);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    feedCache.delete(feedUrl);
    return null;
  }
  return entry;
}

function setCache(feedUrl: string, podcast: Podcast, episodes: Episode[]): void {
  feedCache.set(feedUrl, { podcast, episodes, cachedAt: Date.now() });
}

/** Evict a specific feed from cache. */
function invalidateCache(feedUrl: string): void {
  feedCache.delete(feedUrl);
}

/** Evict all cached feeds. */
function clearCache(): void {
  feedCache.clear();
}

// ---------------------------------------------------------------------------
// Duration Parsing Helper
// ---------------------------------------------------------------------------

/**
 * Parse an iTunes-style duration string into seconds.
 * Accepted formats:
 *   - "3600"       (seconds as plain number)
 *   - "01:00:00"   (HH:MM:SS)
 *   - "30:00"      (MM:SS)
 *   - "1:30:00"    (H:MM:SS)
 */
function parseDuration(raw: string | undefined | null): number {
  if (!raw) return 0;

  const trimmed = raw.trim();

  // Plain number (seconds)
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Image URL Extraction Helper
// ---------------------------------------------------------------------------

function extractImageUrl(
  itunesImage: CustomFeed['itunes:image'] | CustomItem['itunes:image'],
  fallback?: string,
): string {
  if (!itunesImage) return fallback ?? '';

  if (typeof itunesImage === 'string') return itunesImage;

  if (typeof itunesImage === 'object' && '$' in itunesImage) {
    return itunesImage.$.href ?? fallback ?? '';
  }

  return fallback ?? '';
}

// ---------------------------------------------------------------------------
// Explicit Flag Extraction Helper
// ---------------------------------------------------------------------------

function isExplicit(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase().trim();
  return lower === 'yes' || lower === 'true' || lower === 'explicit';
}

// ---------------------------------------------------------------------------
// Category Extraction Helper
// ---------------------------------------------------------------------------

function extractCategories(
  raw: CustomFeed['itunes:category'],
): Category[] {
  if (!raw) return [];

  const items = Array.isArray(raw) ? raw : [raw];
  return items
    .filter((item) => item?.$?.text)
    .map((item, index) => ({
      id: `rss-cat-${index}`,
      name: item.$.text,
      icon: 'tag-outline',
    }));
}

// ---------------------------------------------------------------------------
// Core: Parse Feed
// ---------------------------------------------------------------------------

export interface ParsedFeed {
  podcast: Podcast;
  episodes: Episode[];
}

/**
 * Fetch and parse a podcast RSS feed, returning typed domain objects.
 *
 * @param feedUrl  Absolute URL to the podcast RSS/XML feed.
 * @param options  Optional overrides.
 * @returns        A `ParsedFeed` containing the podcast metadata and its episodes.
 */
async function parseFeed(
  feedUrl: string,
  options?: { skipCache?: boolean },
): Promise<ParsedFeed> {
  // Check cache first (unless explicitly bypassed).
  if (!options?.skipCache) {
    const cached = getCached(feedUrl);
    if (cached) {
      return { podcast: cached.podcast, episodes: cached.episodes };
    }
  }

  const feed = await parser.parseURL(feedUrl);

  // -- Build Podcast ---------------------------------------------------------

  const podcast: Podcast = {
    id: feedUrl, // RSS feeds don't have a canonical numeric ID; use URL as key
    title: feed.title ?? '',
    author:
      (feed['itunes:author'] as string) ?? feed.creator ?? feed.managingEditor ?? '',
    description:
      (feed['itunes:summary'] as string) ?? feed.description ?? '',
    artworkUrl: extractImageUrl(feed['itunes:image'], feed.image?.url),
    feedUrl,
    categories: extractCategories(feed['itunes:category']),
    episodeCount: feed.items?.length ?? 0,
    lastEpisodeDate: feed.items?.[0]?.pubDate
      ? new Date(feed.items[0].pubDate).toISOString()
      : null,
    language: feed.language ?? 'en',
    explicit: isExplicit(feed['itunes:explicit'] as string),
    websiteUrl: feed.link ?? null,
    rating: null,
    ratingCount: 0,
  };

  // -- Build Episodes --------------------------------------------------------

  const episodes: Episode[] = (feed.items ?? []).map((item, index) => {
    const enclosure = item.enclosure;

    return {
      id: item.guid ?? item.link ?? `${feedUrl}-${index}`,
      podcastId: feedUrl,
      title: item.title ?? '',
      description:
        (item['itunes:summary'] as string | undefined) ??
        item.contentSnippet ??
        item.content ??
        '',
      pubDate: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
      duration: parseDuration(item['itunes:duration'] as string | undefined),
      audioUrl: enclosure?.url ?? item.link ?? '',
      artworkUrl: extractImageUrl(item['itunes:image']) || null,
      isPlayed: false,
      playPosition: 0,
      fileSize: enclosure?.length ? parseInt(enclosure.length, 10) : null,
      season: item['itunes:season']
        ? parseInt(item['itunes:season'] as string, 10)
        : null,
      episodeNumber: item['itunes:episode']
        ? parseInt(item['itunes:episode'] as string, 10)
        : null,
      mimeType: enclosure?.type ?? 'audio/mpeg',
      explicit: isExplicit(item['itunes:explicit'] as string | undefined),
    };
  });

  // Store in cache.
  setCache(feedUrl, podcast, episodes);

  return { podcast, episodes };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const feedService = {
  parseFeed,
  invalidateCache,
  clearCache,
};

export default feedService;
