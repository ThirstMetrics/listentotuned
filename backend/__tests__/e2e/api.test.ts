/**
 * Tuned E2E API Tests
 *
 * Tests all public backend API endpoints against the real Podcast Index API.
 * Starts the actual backend server, runs tests, then shuts it down.
 */

import path from 'path';
import { statSync } from 'fs';
import {
  startServer,
  stopServer,
  apiGet,
  downloadFile,
  ensureDownloadDir,
  cleanupDownloadDir,
  DOWNLOAD_DIR,
} from './helpers';

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await startServer(3099);
}, 20_000);

afterAll(() => {
  stopServer();
  cleanupDownloadDir();
});

// ---------------------------------------------------------------------------
// 1. Health Check
// ---------------------------------------------------------------------------

describe('Health Check', () => {
  it('GET /api/health returns 200 with status', async () => {
    const { status, body } = await apiGet('/api/health');
    expect(status).toBe(200);
    expect(body.status).toBeDefined();
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
    console.log('  Health:', body.status, '| Version:', body.version);
  });
});

// ---------------------------------------------------------------------------
// 2. Root endpoint
// ---------------------------------------------------------------------------

describe('Root', () => {
  it('GET / returns API info', async () => {
    const { status, body } = await apiGet('/');
    expect(status).toBe(200);
    expect(body.name).toBe('Tuned API');
    expect(body.endpoints).toBeDefined();
    expect(body.endpoints.podcasts).toBe('/api/podcasts');
  });
});

// ---------------------------------------------------------------------------
// 3. Podcast Search
// ---------------------------------------------------------------------------

describe('Podcast Search', () => {
  it('GET /api/podcasts/search?q=technology returns results', async () => {
    const { status, body } = await apiGet('/api/podcasts/search?q=technology');
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first.title).toBeDefined();
    expect(first.id).toBeDefined();
    console.log(`  Found ${body.data.length} podcasts. First: "${first.title}"`);
  });

  it('GET /api/podcasts/search without q returns 400', async () => {
    const { status, body } = await apiGet('/api/podcasts/search');
    expect(status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('GET /api/podcasts/search?q= (empty) returns 400', async () => {
    const { status, body } = await apiGet('/api/podcasts/search?q=');
    expect(status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. Trending Podcasts
// ---------------------------------------------------------------------------

describe('Trending Podcasts', () => {
  it('GET /api/podcasts/trending returns trending feeds', async () => {
    const { status, body } = await apiGet('/api/podcasts/trending');
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first.title).toBeDefined();
    expect(first.id).toBeDefined();
    console.log(`  Trending: ${body.data.length} podcasts. Top: "${first.title}"`);
  });

  it('GET /api/podcasts/trending?max=5 limits results', async () => {
    const { status, body } = await apiGet('/api/podcasts/trending?max=5');
    expect(status).toBe(200);
    expect(body.data.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// 5. Podcast Episodes
// ---------------------------------------------------------------------------

let testFeedId: number;

describe('Podcast Episodes', () => {
  it('should find a podcast and list its episodes', async () => {
    // Step 1: search for a well-known podcast
    const searchRes = await apiGet('/api/podcasts/search?q=This+American+Life');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    testFeedId = searchRes.body.data[0].id;
    console.log(`  Using feed ID: ${testFeedId} ("${searchRes.body.data[0].title}")`);

    // Step 2: get episodes for that feed
    const episodesRes = await apiGet(`/api/podcasts/${testFeedId}/episodes?limit=10`);
    expect(episodesRes.status).toBe(200);
    expect(episodesRes.body.data).toBeDefined();
    expect(Array.isArray(episodesRes.body.data)).toBe(true);
    expect(episodesRes.body.data.length).toBeGreaterThan(0);

    const ep = episodesRes.body.data[0];
    expect(ep.title).toBeDefined();
    expect(ep.enclosureUrl).toBeDefined();
    console.log(`  Latest episode: "${ep.title}"`);
    console.log(`  Audio URL: ${ep.enclosureUrl}`);
  });
});

// ---------------------------------------------------------------------------
// 6. Podcast Detail by ID
// ---------------------------------------------------------------------------

describe('Podcast Detail', () => {
  it('GET /api/podcasts/:id returns podcast info from Podcast Index', async () => {
    // Use the feed ID found in the episodes test
    if (!testFeedId) {
      // Fallback: search for one
      const searchRes = await apiGet('/api/podcasts/search?q=podcast');
      testFeedId = searchRes.body.data[0].id;
    }

    const { status, body } = await apiGet(`/api/podcasts/${testFeedId}`);
    // May be 200 (found via PI) or 500 (DB error caught) depending on pool
    // The Podcast Index fallback should work
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.title).toBeDefined();
    console.log(`  Podcast detail: "${body.data.title}"`);
  });
});

// ---------------------------------------------------------------------------
// 7. 404 handling
// ---------------------------------------------------------------------------

describe('404 handling', () => {
  it('GET /api/nonexistent returns 404', async () => {
    const { status, body } = await apiGet('/api/nonexistent');
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// 8. FULL DOWNLOAD TEST - Download an actual episode to local disk
// ---------------------------------------------------------------------------

describe('Episode Download (Full E2E)', () => {
  it('should search, find an episode, and download audio to local disk', async () => {
    ensureDownloadDir();

    // Step 1: Search for a podcast with short episodes
    console.log('\n  === DOWNLOAD TEST ===');
    const searchRes = await apiGet('/api/podcasts/search?q=NPR+News+Now');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    const podcast = searchRes.body.data[0];
    console.log(`  Podcast: "${podcast.title}" (ID: ${podcast.id})`);

    // Step 2: Get episodes
    const episodesRes = await apiGet(`/api/podcasts/${podcast.id}/episodes?limit=5`);
    expect(episodesRes.status).toBe(200);
    expect(episodesRes.body.data.length).toBeGreaterThan(0);

    // Find an episode with a valid audio URL
    const episode = episodesRes.body.data.find(
      (ep: any) => ep.enclosureUrl && ep.enclosureUrl.startsWith('http'),
    );
    expect(episode).toBeDefined();

    console.log(`  Episode: "${episode.title}"`);
    console.log(`  Audio URL: ${episode.enclosureUrl}`);
    console.log(`  Duration: ${episode.duration}s`);

    // Step 3: Download the audio file to local disk
    const filename = `episode_${episode.id}.mp3`;
    const destPath = path.join(DOWNLOAD_DIR, filename);

    console.log(`  Downloading to: ${destPath}`);

    const bytes = await downloadFile(episode.enclosureUrl, destPath);

    console.log(`  Downloaded: ${(bytes / 1024).toFixed(1)} KB`);

    // Step 4: Verify the file exists and has content
    const stat = statSync(destPath);
    expect(stat.size).toBeGreaterThan(0);
    console.log(`  File size on disk: ${(stat.size / 1024).toFixed(1)} KB`);
    console.log('  === DOWNLOAD TEST PASSED ===\n');
  }, 60_000); // Allow 60s for download
});
