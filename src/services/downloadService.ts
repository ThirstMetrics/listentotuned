/**
 * Tuned Podcast Player - Episode Download Manager
 *
 * Downloads podcast episode audio files to local device storage using
 * react-native-fs.  Tracks in-flight downloads, exposes pause/cancel/delete
 * operations, and reports progress via callbacks.
 *
 * File layout:  DocumentDirectoryPath/episodes/{episodeId}.mp3
 */

import RNFS, {
  DownloadBeginCallbackResult,
  DownloadProgressCallbackResult,
  DownloadResult,
} from 'react-native-fs';
import type { Episode } from '../types/podcast';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EPISODES_DIR = `${RNFS.DocumentDirectoryPath}/episodes`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DownloadStatus =
  | 'idle'
  | 'downloading'
  | 'paused'
  | 'complete'
  | 'error';

export interface DownloadProgress {
  episodeId: string;
  status: DownloadStatus;
  /** Bytes received so far. */
  bytesWritten: number;
  /** Total expected bytes (-1 if unknown). */
  contentLength: number;
  /** Fraction complete 0-1 (0 if contentLength unknown). */
  percent: number;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

interface ActiveDownload {
  jobId: number;
  episodeId: string;
  status: DownloadStatus;
  bytesWritten: number;
  contentLength: number;
  progressCallback?: ProgressCallback;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Active and recently-completed downloads keyed by episodeId. */
const downloads = new Map<string, ActiveDownload>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure the episodes directory exists. */
async function ensureDir(): Promise<void> {
  const exists = await RNFS.exists(EPISODES_DIR);
  if (!exists) {
    await RNFS.mkdir(EPISODES_DIR);
  }
}

/** Derive the local file path for a given episode ID. */
function localPath(episodeId: string): string {
  return `${EPISODES_DIR}/${episodeId}.mp3`;
}

function buildProgress(dl: ActiveDownload): DownloadProgress {
  return {
    episodeId: dl.episodeId,
    status: dl.status,
    bytesWritten: dl.bytesWritten,
    contentLength: dl.contentLength,
    percent:
      dl.contentLength > 0
        ? Math.min(dl.bytesWritten / dl.contentLength, 1)
        : 0,
  };
}

// ---------------------------------------------------------------------------
// Download Episode
// ---------------------------------------------------------------------------

/**
 * Start downloading an episode's audio file.
 *
 * @param episode           The episode to download.
 * @param onProgress        Optional callback fired on each progress tick.
 * @returns                 A promise that resolves when the download completes.
 */
async function downloadEpisode(
  episode: Episode,
  onProgress?: ProgressCallback,
): Promise<DownloadProgress> {
  await ensureDir();

  const filePath = localPath(episode.id);

  // If already downloaded, return immediately.
  const alreadyExists = await RNFS.exists(filePath);
  if (alreadyExists) {
    const stat = await RNFS.stat(filePath);
    const progress: DownloadProgress = {
      episodeId: episode.id,
      status: 'complete',
      bytesWritten: Number(stat.size),
      contentLength: Number(stat.size),
      percent: 1,
    };
    return progress;
  }

  // If download is already in-flight, return existing progress.
  const existing = downloads.get(episode.id);
  if (existing && existing.status === 'downloading') {
    existing.progressCallback = onProgress;
    return buildProgress(existing);
  }

  return new Promise<DownloadProgress>((resolve, reject) => {
    const { jobId, promise } = RNFS.downloadFile({
      fromUrl: episode.audioUrl,
      toFile: filePath,
      background: true,
      discretionary: true,
      cacheable: false,
      begin: (res: DownloadBeginCallbackResult) => {
        const dl: ActiveDownload = {
          jobId: res.jobId,
          episodeId: episode.id,
          status: 'downloading',
          bytesWritten: 0,
          contentLength: res.contentLength ?? -1,
          progressCallback: onProgress,
        };
        downloads.set(episode.id, dl);
      },
      progress: (res: DownloadProgressCallbackResult) => {
        const dl = downloads.get(episode.id);
        if (dl) {
          dl.bytesWritten = res.bytesWritten;
          dl.contentLength = res.contentLength;
          dl.progressCallback?.(buildProgress(dl));
        }
      },
      progressDivider: 5, // fire progress every 5% approx
    });

    // Store a preliminary record so callers can find the jobId immediately.
    if (!downloads.has(episode.id)) {
      downloads.set(episode.id, {
        jobId,
        episodeId: episode.id,
        status: 'downloading',
        bytesWritten: 0,
        contentLength: -1,
        progressCallback: onProgress,
      });
    }

    promise
      .then((result: DownloadResult) => {
        const dl = downloads.get(episode.id);
        if (dl) {
          dl.status = result.statusCode === 200 ? 'complete' : 'error';
          dl.bytesWritten = result.bytesWritten;
          dl.progressCallback?.(buildProgress(dl));
        }

        const finalProgress: DownloadProgress = {
          episodeId: episode.id,
          status: result.statusCode === 200 ? 'complete' : 'error',
          bytesWritten: result.bytesWritten,
          contentLength: dl?.contentLength ?? result.bytesWritten,
          percent: result.statusCode === 200 ? 1 : 0,
        };
        resolve(finalProgress);
      })
      .catch((err: Error) => {
        const dl = downloads.get(episode.id);
        if (dl) {
          dl.status = 'error';
          dl.progressCallback?.(buildProgress(dl));
        }
        reject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// Pause / Cancel / Delete
// ---------------------------------------------------------------------------

/**
 * Pause (stop) an in-progress download.
 * React-native-fs does not support true pause/resume, so this cancels the
 * network request. A future `downloadEpisode` call will re-download.
 */
function pauseDownload(episodeId: string): void {
  const dl = downloads.get(episodeId);
  if (dl && dl.status === 'downloading') {
    RNFS.stopDownload(dl.jobId);
    dl.status = 'paused';
    dl.progressCallback?.(buildProgress(dl));
  }
}

/**
 * Cancel an in-progress download and remove any partial file.
 */
async function cancelDownload(episodeId: string): Promise<void> {
  const dl = downloads.get(episodeId);
  if (dl) {
    if (dl.status === 'downloading') {
      RNFS.stopDownload(dl.jobId);
    }
    downloads.delete(episodeId);
  }

  const filePath = localPath(episodeId);
  const exists = await RNFS.exists(filePath);
  if (exists) {
    await RNFS.unlink(filePath);
  }
}

/**
 * Delete a previously downloaded episode from local storage.
 */
async function deleteDownload(episodeId: string): Promise<void> {
  downloads.delete(episodeId);

  const filePath = localPath(episodeId);
  const exists = await RNFS.exists(filePath);
  if (exists) {
    await RNFS.unlink(filePath);
  }
}

// ---------------------------------------------------------------------------
// Query Helpers
// ---------------------------------------------------------------------------

/**
 * Return the local file path for an episode if it has been downloaded.
 * Returns null if the file does not exist on disk.
 */
async function getLocalPath(episodeId: string): Promise<string | null> {
  const filePath = localPath(episodeId);
  const exists = await RNFS.exists(filePath);
  return exists ? filePath : null;
}

/**
 * Return the current download progress for an episode.
 * Returns null if no download is tracked for this episode.
 */
function getDownloadProgress(episodeId: string): DownloadProgress | null {
  const dl = downloads.get(episodeId);
  return dl ? buildProgress(dl) : null;
}

/**
 * Calculate the total bytes used by all downloaded episodes.
 */
async function calculateStorageUsed(): Promise<number> {
  await ensureDir();

  const files = await RNFS.readDir(EPISODES_DIR);
  return files.reduce((total, file) => total + Number(file.size), 0);
}

/**
 * List all episode IDs that have been downloaded.
 */
async function listDownloadedEpisodeIds(): Promise<string[]> {
  await ensureDir();

  const files = await RNFS.readDir(EPISODES_DIR);
  return files
    .filter((f) => f.isFile() && f.name.endsWith('.mp3'))
    .map((f) => f.name.replace(/\.mp3$/, ''));
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const downloadService = {
  downloadEpisode,
  pauseDownload,
  cancelDownload,
  deleteDownload,
  getLocalPath,
  getDownloadProgress,
  calculateStorageUsed,
  listDownloadedEpisodeIds,
};

export default downloadService;
