import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import config from '../config/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PodcastResult {
  id: number;
  title: string;
  url: string;
  originalUrl: string;
  description: string;
  author: string;
  image: string;
  artwork: string;
  categories: Record<string, string>;
  episodeCount: number;
  language: string;
}

export interface EpisodeResult {
  id: number;
  title: string;
  description: string;
  datePublished: number;
  datePublishedPretty: string;
  duration: number;
  enclosureUrl: string;
  enclosureType: string;
  enclosureLength: number;
  image: string;
  feedId: number;
  season: number;
  episode: number;
}

// ---------------------------------------------------------------------------
// Podcast Index API Client
// ---------------------------------------------------------------------------
export class PodcastIndexService {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = config.podcastIndex.key;
    this.apiSecret = config.podcastIndex.secret;

    this.client = axios.create({
      baseURL: config.podcastIndex.baseUrl,
      timeout: 15_000,
    });
  }

  /**
   * Generate authentication headers for Podcast Index API.
   * Uses SHA-1 hash of (apiKey + apiSecret + unixTimestamp).
   */
  private getAuthHeaders(): Record<string, string> {
    const apiHeaderTime = Math.floor(Date.now() / 1000);
    const hash = crypto
      .createHash('sha1')
      .update(this.apiKey + this.apiSecret + apiHeaderTime)
      .digest('hex');

    return {
      'X-Auth-Key': this.apiKey,
      'X-Auth-Date': String(apiHeaderTime),
      'Authorization': hash,
      'User-Agent': 'TunedPodcastPlayer/1.0',
    };
  }

  /**
   * Search podcasts by term.
   */
  async search(query: string): Promise<PodcastResult[]> {
    const response = await this.client.get('/search/byterm', {
      headers: this.getAuthHeaders(),
      params: { q: query },
    });
    return response.data.feeds ?? [];
  }

  /**
   * Get trending podcasts.
   */
  async getTrending(
    max: number = 20,
    lang: string = 'en',
    category?: string
  ): Promise<PodcastResult[]> {
    const params: Record<string, string | number> = { max, lang };
    if (category) {
      params.cat = category;
    }

    const response = await this.client.get('/podcasts/trending', {
      headers: this.getAuthHeaders(),
      params,
    });
    return response.data.feeds ?? [];
  }

  /**
   * Get podcast details by Podcast Index feed ID.
   */
  async getPodcastById(feedId: number): Promise<PodcastResult | null> {
    const response = await this.client.get('/podcasts/byfeedid', {
      headers: this.getAuthHeaders(),
      params: { id: feedId },
    });
    return response.data.feed ?? null;
  }

  /**
   * Get episodes by Podcast Index feed ID.
   */
  async getEpisodesByFeedId(feedId: number, max: number = 100): Promise<EpisodeResult[]> {
    const response = await this.client.get('/episodes/byfeedid', {
      headers: this.getAuthHeaders(),
      params: { id: feedId, max },
    });
    return response.data.items ?? [];
  }
}
