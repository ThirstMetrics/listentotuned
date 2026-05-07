/**
 * Tuned Podcast Player - Download Store
 *
 * Manages episode downloads: progress tracking, queue ordering, and
 * on-disk metadata. Download metadata (status, file paths) is persisted to
 * MMKV so the app knows which episodes are available offline after a restart.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import RNFS from 'react-native-fs';

import type { Episode } from '../types/podcast';
import { mmkvStorage } from './mmkvStorage';

// ---------------------------------------------------------------------------
// Download status
// ---------------------------------------------------------------------------

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error';

// ---------------------------------------------------------------------------
// Download entry
// ---------------------------------------------------------------------------

export interface DownloadEntry {
  episodeId: string;
  /** Download progress from 0 to 1. */
  progress: number;
  status: DownloadStatus;
  /** Local file path once downloaded (null while still in progress). */
  filePath: string | null;
  /** File size in bytes (mirrored from Episode for display). */
  fileSize: number | null;
  /** Human-readable error message when status is 'error'. */
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface DownloadState {
  /** Map of episodeId -> download metadata. */
  downloads: Record<string, DownloadEntry>;
  /** Ordered queue of episode IDs waiting to be downloaded. */
  downloadQueue: string[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface DownloadActions {
  /** Begin downloading an episode (adds to queue if another is active). */
  startDownload: (episode: Episode) => void;
  /** Pause an active download. */
  pauseDownload: (episodeId: string) => void;
  /** Resume a paused download. */
  resumeDownload: (episodeId: string) => void;
  /** Cancel and remove a download (also removes partial file reference). */
  cancelDownload: (episodeId: string) => void;
  /** Remove a completed download (frees disk space). */
  removeDownload: (episodeId: string) => void;
  /** Get an array of all completed download entries. */
  getDownloadedEpisodes: () => DownloadEntry[];
  /** Check whether an episode is available offline. */
  isDownloaded: (episodeId: string) => boolean;
  /** Update progress for an active download (called by download service). */
  updateProgress: (episodeId: string, progress: number) => void;
  /** Mark a download as completed with its local file path. */
  completeDownload: (episodeId: string, filePath: string) => void;
  /** Mark a download as failed with an error message. */
  failDownload: (episodeId: string, errorMessage: string) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: DownloadState = {
  downloads: {},
  downloadQueue: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDownloadStore = create<DownloadState & DownloadActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // -- Lifecycle ----------------------------------------------------------

      startDownload: (episode) =>
        set((state) => {
          // Skip if already downloaded or in queue
          const existing = state.downloads[episode.id];
          if (existing && existing.status !== 'error') return state;

          const entry: DownloadEntry = {
            episodeId: episode.id,
            progress: 0,
            status: 'queued',
            filePath: null,
            fileSize: episode.fileSize,
            errorMessage: null,
          };

          return {
            downloads: { ...state.downloads, [episode.id]: entry },
            downloadQueue: [...state.downloadQueue, episode.id],
          };
        }),

      pauseDownload: (episodeId) =>
        set((state) => {
          const entry = state.downloads[episodeId];
          if (!entry || entry.status !== 'downloading') return state;

          return {
            downloads: {
              ...state.downloads,
              [episodeId]: { ...entry, status: 'paused' },
            },
          };
        }),

      resumeDownload: (episodeId) =>
        set((state) => {
          const entry = state.downloads[episodeId];
          if (!entry || entry.status !== 'paused') return state;

          return {
            downloads: {
              ...state.downloads,
              [episodeId]: { ...entry, status: 'downloading' },
            },
          };
        }),

      cancelDownload: (episodeId) =>
        set((state) => {
          const remainingDownloads = { ...state.downloads };
          delete remainingDownloads[episodeId];
          return {
            downloads: remainingDownloads,
            downloadQueue: state.downloadQueue.filter((id) => id !== episodeId),
          };
        }),

      removeDownload: (episodeId) => {
        const entry = get().downloads[episodeId];
        if (entry?.filePath) {
          RNFS.unlink(entry.filePath).catch(() => {
            // File may already be gone — ignore
          });
        }
        set((state) => {
          const remainingDownloads = { ...state.downloads };
          delete remainingDownloads[episodeId];
          return {
            downloads: remainingDownloads,
            downloadQueue: state.downloadQueue.filter((id) => id !== episodeId),
          };
        });
      },

      // -- Queries ------------------------------------------------------------

      getDownloadedEpisodes: () =>
        Object.values(get().downloads).filter(
          (entry) => entry.status === 'completed',
        ),

      isDownloaded: (episodeId) =>
        get().downloads[episodeId]?.status === 'completed',

      // -- Progress updates (from download service) ---------------------------

      updateProgress: (episodeId, progress) =>
        set((state) => {
          const entry = state.downloads[episodeId];
          if (!entry) return state;

          return {
            downloads: {
              ...state.downloads,
              [episodeId]: {
                ...entry,
                progress: Math.max(0, Math.min(1, progress)),
                status: 'downloading',
              },
            },
          };
        }),

      completeDownload: (episodeId, filePath) =>
        set((state) => {
          const entry = state.downloads[episodeId];
          if (!entry) return state;

          return {
            downloads: {
              ...state.downloads,
              [episodeId]: {
                ...entry,
                progress: 1,
                status: 'completed',
                filePath,
              },
            },
            downloadQueue: state.downloadQueue.filter((id) => id !== episodeId),
          };
        }),

      failDownload: (episodeId, errorMessage) =>
        set((state) => {
          const entry = state.downloads[episodeId];
          if (!entry) return state;

          return {
            downloads: {
              ...state.downloads,
              [episodeId]: {
                ...entry,
                status: 'error',
                errorMessage,
              },
            },
            downloadQueue: state.downloadQueue.filter((id) => id !== episodeId),
          };
        }),
    }),
    {
      name: 'tuned-download-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Persist all download metadata (but progress of in-flight downloads
      // will be stale — the download service should reconcile on startup).
      partialize: (state) => ({
        downloads: state.downloads,
        downloadQueue: state.downloadQueue,
      }),
    },
  ),
);
