/**
 * E2E Test Helpers
 *
 * Starts the real backend server on a random port for integration testing.
 */

import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { createWriteStream, mkdirSync, existsSync, statSync, unlinkSync, rmdirSync } from 'fs';
import https from 'https';
import http from 'http';

const BACKEND_DIR = path.resolve(__dirname, '../..');
const STARTUP_TIMEOUT = 15_000;

export let serverProcess: ChildProcess | null = null;
export let baseUrl = '';

/**
 * Start the backend server and wait until it responds to /api/health.
 */
export async function startServer(port = 3099): Promise<string> {
  baseUrl = `http://localhost:${port}`;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start within ${STARTUP_TIMEOUT}ms`));
    }, STARTUP_TIMEOUT);

    serverProcess = spawn(
      'npx',
      ['ts-node', '--transpile-only', 'src/server.ts'],
      {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let output = '';

    serverProcess.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
      // Server prints "running on port" when ready
      if (output.includes('running on port')) {
        clearTimeout(timeout);
        resolve(baseUrl);
      }
    });

    serverProcess.stderr?.on('data', (data: Buffer) => {
      // ts-node may emit diagnostics here; only reject on crash
      const msg = data.toString();
      if (msg.includes('Error') && !msg.includes('ExperimentalWarning')) {
        console.error('[server stderr]', msg);
      }
    });

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}\n${output}`));
      }
    });
  });
}

/**
 * Stop the backend server.
 */
export function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    serverProcess = null;
  }
}

/**
 * Simple HTTP GET that returns parsed JSON.
 */
export async function apiGet<T = any>(path: string): Promise<{ status: number; body: T }> {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

/**
 * Download a file from a URL to a local path.
 * Returns the number of bytes written.
 */
export function downloadFile(url: string, destPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout: 30_000 }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with status ${res.statusCode}`));
        return;
      }

      const dir = path.dirname(destPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const fileStream = createWriteStream(destPath);
      let bytes = 0;

      res.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(bytes);
      });

      fileStream.on('error', (err) => {
        unlinkSync(destPath);
        reject(err);
      });
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Download timed out'));
    });
  });
}

/** Temp directory for test downloads. */
export const DOWNLOAD_DIR = path.resolve(BACKEND_DIR, '__tests__', 'e2e', '.downloads');

export function ensureDownloadDir(): void {
  if (!existsSync(DOWNLOAD_DIR)) {
    mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

export function cleanupDownloadDir(): void {
  if (existsSync(DOWNLOAD_DIR)) {
    const files = require('fs').readdirSync(DOWNLOAD_DIR);
    for (const file of files) {
      unlinkSync(path.join(DOWNLOAD_DIR, file));
    }
    rmdirSync(DOWNLOAD_DIR);
  }
}
