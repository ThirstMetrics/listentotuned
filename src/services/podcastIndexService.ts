/**
 * Tuned Podcast Player - Podcast Index API Service
 *
 * Integration with the free Podcast Index API (https://podcastindex.org).
 *
 * Authentication:
 *   - Each request requires three headers:
 *       X-Auth-Key:    the API key
 *       X-Auth-Date:   current Unix epoch (seconds)
 *       Authorization: SHA-1 hex digest of (apiKey + apiSecret + authDate)
 *   - User-Agent: "Tuned/1.0"
 */

import axios, { AxiosInstance } from 'axios';
import type { Podcast, Episode, Category, SearchResult } from '../types/podcast';

// ---------------------------------------------------------------------------
// Config Placeholder - Replace with secure config / env at build time
// ---------------------------------------------------------------------------

/**
 * API credentials should be injected from a secure source (e.g. react-native-config,
 * a secrets manager, or build-time environment variables).
 * NEVER commit real credentials to source control.
 */
const PODCAST_INDEX_API_KEY: string =
  (globalThis as any).__PODCAST_INDEX_API_KEY__ ?? '';
const PODCAST_INDEX_API_SECRET: string =
  (globalThis as any).__PODCAST_INDEX_API_SECRET__ ?? '';

const API_BASE = 'https://api.podcastindex.org/api/1.0';

// ---------------------------------------------------------------------------
// SHA-1 Helper (using react-native compatible approach)
// ---------------------------------------------------------------------------

/**
 * Compute a SHA-1 hex digest.
 *
 * Uses the SubtleCrypto API which is available in modern React Native
 * Hermes runtimes. Falls back to a pure-JS implementation if needed.
 */
async function sha1(input: string): Promise<string> {
  // Modern Hermes (React Native 0.73+) supports the Web Crypto API.
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined'
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-1', data.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: minimal SHA-1 implementation (RFC 3174) ------------------
  // Only used if SubtleCrypto is unavailable.
  return sha1Fallback(input);
}

/** Pure-JS SHA-1 (RFC 3174). */
function sha1Fallback(message: string): string {
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  function toHex(num: number): string {
    let hex = '';
    for (let i = 7; i >= 0; i--) {
      hex += ((num >>> (i * 4)) & 0x0f).toString(16);
    }
    return hex;
  }

  // Convert string to UTF-8 byte array
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);
  const msgLength = msgBytes.length;

  // Pre-processing: add padding
  const words: number[] = [];
  for (let i = 0; i < msgLength; i++) {
    const wordIndex = i >>> 2;
    if (words[wordIndex] === undefined) words[wordIndex] = 0;
    words[wordIndex] |= msgBytes[i] << (24 - (i % 4) * 8);
  }
  const bitLength = msgLength * 8;
  const paddingWordIndex = msgLength >>> 2;
  if (words[paddingWordIndex] === undefined) words[paddingWordIndex] = 0;
  words[paddingWordIndex] |= 0x80 << (24 - (msgLength % 4) * 8);

  const totalWords = (((msgLength + 8) >>> 6) + 1) * 16;
  for (let i = words.length; i < totalWords; i++) {
    words[i] = 0;
  }
  words[totalWords - 1] = bitLength;

  // Initialise hash values
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);

  for (let blockStart = 0; blockStart < totalWords; blockStart += 16) {
    for (let i = 0; i < 16; i++) {
      w[i] = words[blockStart + i];
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotateLeft(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[i]) & 0xffffffff;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) & 0xffffffff;
    h1 = (h1 + b) & 0xffffffff;
    h2 = (h2 + c) & 0xffffffff;
    h3 = (h3 + d) & 0xffffffff;
    h4 = (h4 + e) & 0xffffffff;
  }

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}

// ---------------------------------------------------------------------------
// Axios Instance with Auth Headers
// ---------------------------------------------------------------------------

async function createAuthHeaders(): Promise<Record<string, string>> {
  const authDate = Math.floor(Date.now() / 1000).toString();
  const authHash = await sha1(
    PODCAST_INDEX_API_KEY + PODCAST_INDEX_API_SECRET + authDate,
  );

  return {
    'X-Auth-Key': PODCAST_INDEX_API_KEY,
    'X-Auth-Date': authDate,
    Authorization: authHash,
    'User-Agent': 'Tuned/1.0',
  };
}

const podcastIndexClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach auth headers to every request.
podcastIndexClient.interceptors.request.use(async (config) => {
  const authHeaders = await createAuthHeaders();
  Object.assign(config.headers, authHeaders);
  return config;
});

// ---------------------------------------------------------------------------
// Podcast Index Raw Response Types
// ---------------------------------------------------------------------------

interface PIFeed {
  id: number;
  title: string;
  url: string;
  originalUrl: string;
  link: string;
  description: string;
  author: string;
  image: string;
  artwork: string;
  language: string;
  categories: Record<string, string> | null;
  episodeCount: number;
  newestItemPublishTime: number;
  explicit: boolean;
  itunesId: number | null;
}

interface PIEpisode {
  id: number;
  feedId: number;
  title: string;
  description: string;
  datePublished: number;
  duration: number;
  enclosureUrl: string;
  enclosureType: string;
  enclosureLength: number;
  image: string;
  feedImage: string;
  season: number;
  episode: number;
  explicit: number; // 0 or 1
}

interface PICategory {
  id: number;
  name: string;
}

interface PISearchResponse {
  status: string;
  feeds: PIFeed[];
  count: number;
  description: string;
}

interface PITrendingResponse {
  status: string;
  feeds: PIFeed[];
  count: number;
  description: string;
}

interface PIPodcastResponse {
  status: string;
  feed: PIFeed;
  description: string;
}

interface PIEpisodesResponse {
  status: string;
  items: PIEpisode[];
  count: number;
  description: string;
}

interface PIRecentEpisodesResponse {
  status: string;
  items: PIEpisode[];
  count: number;
  description: string;
}

interface PICategoriesResponse {
  status: string;
  feeds: PICategory[];
  count: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Mappers: Podcast Index -> Tuned Domain Types
// ---------------------------------------------------------------------------

function mapPIFeedToPodcast(feed: PIFeed): Podcast {
  const categories: Category[] = feed.categories
    ? Object.entries(feed.categories).map(([id, name]) => ({
        id,
        name,
        icon: 'tag-outline', // default icon; UI can override based on name
      }))
    : [];

  return {
    id: String(feed.id),
    title: feed.title ?? '',
    author: feed.author ?? '',
    description: feed.description ?? '',
    artworkUrl: feed.artwork || feed.image || '',
    feedUrl: feed.url ?? feed.originalUrl ?? '',
    categories,
    episodeCount: feed.episodeCount ?? 0,
    lastEpisodeDate: feed.newestItemPublishTime
      ? new Date(feed.newestItemPublishTime * 1000).toISOString()
      : null,
    language: feed.language ?? 'en',
    explicit: feed.explicit ?? false,
    websiteUrl: feed.link ?? null,
    rating: null,
    ratingCount: 0,
  };
}

function mapPIEpisodeToEpisode(ep: PIEpisode): Episode {
  return {
    id: String(ep.id),
    podcastId: String(ep.feedId),
    title: ep.title ?? '',
    description: ep.description ?? '',
    pubDate: ep.datePublished
      ? new Date(ep.datePublished * 1000).toISOString()
      : new Date().toISOString(),
    duration: ep.duration ?? 0,
    audioUrl: ep.enclosureUrl ?? '',
    artworkUrl: ep.image || ep.feedImage || null,
    isPlayed: false,
    playPosition: 0,
    fileSize: ep.enclosureLength ?? null,
    season: ep.season || null,
    episodeNumber: ep.episode || null,
    mimeType: ep.enclosureType ?? 'audio/mpeg',
    explicit: ep.explicit === 1,
  };
}

function mapPICategoryToCategory(cat: PICategory): Category {
  return {
    id: String(cat.id),
    name: cat.name,
    icon: 'tag-outline',
  };
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * Search podcasts by term.
 * @see https://podcastindex-org.github.io/docs-api/#tag--Search
 */
async function searchPodcasts(
  query: string,
  max: number = 25,
): Promise<SearchResult[]> {
  const { data } = await podcastIndexClient.get<PISearchResponse>(
    '/search/byterm',
    { params: { q: query, max } },
  );

  return (data.feeds ?? []).map((feed, index) => ({
    podcast: mapPIFeedToPodcast(feed),
    relevanceScore: Math.max(0, 1 - index * 0.03), // descending relevance
  }));
}

/**
 * Get currently trending podcasts.
 * @see https://podcastindex-org.github.io/docs-api/#tag--Podcasts
 */
async function getTrending(
  max: number = 25,
  cat?: string,
): Promise<Podcast[]> {
  const params: Record<string, string | number> = { max };
  if (cat) {
    params.cat = cat;
  }

  const { data } = await podcastIndexClient.get<PITrendingResponse>(
    '/podcasts/trending',
    { params },
  );

  return (data.feeds ?? []).map(mapPIFeedToPodcast);
}

/**
 * Get podcast details by Podcast Index feed ID.
 */
async function getPodcastById(feedId: number): Promise<Podcast> {
  const { data } = await podcastIndexClient.get<PIPodcastResponse>(
    '/podcasts/byfeedid',
    { params: { id: feedId } },
  );

  return mapPIFeedToPodcast(data.feed);
}

/**
 * Get podcast details by RSS feed URL.
 */
async function getPodcastByFeedUrl(url: string): Promise<Podcast> {
  const { data } = await podcastIndexClient.get<PIPodcastResponse>(
    '/podcasts/byfeedurl',
    { params: { url } },
  );

  return mapPIFeedToPodcast(data.feed);
}

/**
 * Get episodes for a given podcast feed ID.
 */
async function getEpisodesByFeedId(
  feedId: number,
  max: number = 50,
): Promise<Episode[]> {
  const { data } = await podcastIndexClient.get<PIEpisodesResponse>(
    '/episodes/byfeedid',
    { params: { id: feedId, max } },
  );

  return (data.items ?? []).map(mapPIEpisodeToEpisode);
}

/**
 * Get the most recently published episodes across all podcasts.
 */
async function getRecentEpisodes(max: number = 25): Promise<Episode[]> {
  const { data } = await podcastIndexClient.get<PIRecentEpisodesResponse>(
    '/recent/episodes',
    { params: { max } },
  );

  return (data.items ?? []).map(mapPIEpisodeToEpisode);
}

/**
 * Get the full category list from Podcast Index.
 */
async function getCategories(): Promise<Category[]> {
  const { data } = await podcastIndexClient.get<PICategoriesResponse>(
    '/categories/list',
  );

  return (data.feeds ?? []).map(mapPICategoryToCategory);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const podcastIndexService = {
  searchPodcasts,
  getTrending,
  getPodcastById,
  getPodcastByFeedUrl,
  getEpisodesByFeedId,
  getRecentEpisodes,
  getCategories,
};

export default podcastIndexService;
