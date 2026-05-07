/**
 * Tuned Podcast Player - Download Manager Service
 *
 * Bridges the download store (Zustand) and download service (RNFS).
 * Watches the download queue and processes one download at a time.
 */

import { useDownloadStore } from '../stores/downloadStore';
import { usePodcastStore } from '../stores/podcastStore';
import downloadService from './downloadService';
import type { Episode } from '../types/podcast';

let isProcessing = false;
let activeDownload = false;
let unsubscribe: (() => void) | null = null;

/**
 * Find an episode by ID from the podcast store.
 */
function findEpisode(episodeId: string): Episode | null {
  const podcastState = usePodcastStore.getState();

  // Check recent episodes first
  const recentEpisode = podcastState.recentEpisodes.find(
    (ep) => ep.id === episodeId,
  );
  if (recentEpisode) return recentEpisode;

  // Check episodes by podcast
  for (const episodes of Object.values(podcastState.episodesByPodcast)) {
    const episode = episodes.find((ep) => ep.id === episodeId);
    if (episode) return episode;
  }

  return null;
}

/**
 * Process the next queued item in the download queue.
 */
async function processNextDownload(): Promise<void> {
  if (activeDownload) return;

  const { downloadQueue, downloads } = useDownloadStore.getState();

  // Find the first episode ID in the queue whose status is 'queued'
  const nextEpisodeId = downloadQueue.find((id) => {
    const entry = downloads[id];
    return entry && entry.status === 'queued';
  });

  if (!nextEpisodeId) return;

  activeDownload = true;

  const episode = findEpisode(nextEpisodeId);

  if (!episode) {
    useDownloadStore.getState().failDownload(nextEpisodeId, 'Episode data not found');
    activeDownload = false;
    await processNextDownload();
    return;
  }

  try {
    await downloadService.downloadEpisode(episode, (progress) => {
      useDownloadStore.getState().updateProgress(nextEpisodeId, progress.percent);
    });

    const filePath = await downloadService.getLocalPath(nextEpisodeId);
    useDownloadStore
      .getState()
      .completeDownload(nextEpisodeId, filePath ?? `episodes/${nextEpisodeId}.mp3`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    useDownloadStore.getState().failDownload(nextEpisodeId, errorMessage);
  }

  activeDownload = false;

  // Process the next item in the queue
  await processNextDownload();
}

/**
 * Subscribe to the download store and begin processing the queue.
 */
function startProcessing(): void {
  if (isProcessing) return;
  isProcessing = true;

  // Reconcile stale downloads from a previous session crash:
  // any entry stuck in 'downloading' gets reset to 'queued'.
  const { downloadQueue, downloads, updateProgress } =
    useDownloadStore.getState();
  for (const id of downloadQueue) {
    const entry = downloads[id];
    if (entry && entry.status === 'downloading') {
      // updateProgress sets status to 'downloading' but resets progress;
      // we actually need to re-queue it. Use the store's internal set.
      // Simplest: fail it so the user can retry, or just set progress 0.
      // Re-queuing by updating progress to 0 will mark it as 'downloading'
      // which processNext will skip. Instead, we directly patch the store.
      useDownloadStore.setState((state) => ({
        downloads: {
          ...state.downloads,
          [id]: { ...state.downloads[id], status: 'queued', progress: 0 },
        },
      }));
    }
  }

  // Subscribe to any store change and try to process the queue
  unsubscribe = useDownloadStore.subscribe(() => {
    if (!activeDownload) {
      processNextDownload().catch((err) => {
        console.error('[DownloadManager] queue processing error:', err);
      });
    }
  });

  // Process any items already in the queue
  processNextDownload().catch((err) => {
    console.error('[DownloadManager] initial processing error:', err);
  });
}

/**
 * Stop watching the download queue.
 */
function stopProcessing(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  isProcessing = false;
}

export const downloadManager = { startProcessing, stopProcessing };
export default downloadManager;
