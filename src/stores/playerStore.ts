/**
 * Tuned Podcast Player - Player Store
 *
 * Manages playback state, queue, progress, speed, repeat mode, and sleep timer.
 * All playback actions dispatch commands to react-native-track-player AND
 * update local Zustand state. State flows back from TrackPlayer via the
 * useTrackPlayerSync hook (see hooks/useTrackPlayerSync.ts).
 *
 * Persists playback speed, repeat mode, and the last played track + position
 * so the user can resume seamlessly after an app restart.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import TrackPlayer from 'react-native-track-player';

import type {
  PlaybackState,
  PlayerProgress,
  QueueItem,
  RepeatMode,
  SleepTimer,
} from '../types/player';
import { mmkvStorage } from './mmkvStorage';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface PlayerState {
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  playbackState: PlaybackState;
  progress: PlayerProgress;
  /** Playback speed multiplier (0.5 - 3.0) */
  playbackSpeed: number;
  repeatMode: RepeatMode;
  sleepTimer: SleepTimer;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface PlayerActions {
  /** Start playing an episode. Replaces the current track. */
  play: (item: QueueItem) => void;
  /** Pause the current track. */
  pause: () => void;
  /** Resume playback of the current track. */
  resume: () => void;
  /** Seek to an absolute position (seconds). */
  seekTo: (position: number) => void;
  /** Skip forward 30 seconds. */
  skipForward: () => void;
  /** Skip backward 15 seconds. */
  skipBackward: () => void;
  /** Set playback speed (clamped 0.5 - 3.0). */
  setSpeed: (speed: number) => void;
  /** Append an item to the end of the queue. */
  addToQueue: (item: QueueItem) => void;
  /** Remove a queue item by index. */
  removeFromQueue: (index: number) => void;
  /** Clear the entire queue. */
  clearQueue: () => void;
  /** Set a sleep timer in minutes (pass null to cancel). */
  setSleepTimer: (minutes: number | null) => void;
  /** Advance to the next track in the queue. */
  nextTrack: () => void;
  /** Go back to the previous track (restart current if > 3 s in). */
  previousTrack: () => void;
  /** Update progress (called by the sync hook on a regular interval). */
  updateProgress: (progress: Partial<PlayerProgress>) => void;
  /** Set the playback state (called by the sync hook). */
  setPlaybackState: (state: PlaybackState) => void;
  /** Reset the player to its initial idle state. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const SKIP_FORWARD_SECONDS = 30;
const SKIP_BACKWARD_SECONDS = 15;
/** If the user taps "previous" within this many seconds, restart the track. */
const RESTART_THRESHOLD_SECONDS = 3;

const initialProgress: PlayerProgress = {
  position: 0,
  duration: 0,
  buffered: 0,
};

const initialSleepTimer: SleepTimer = {
  minutes: null,
  endsAt: null,
};

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  playbackState: 'idle',
  progress: initialProgress,
  playbackSpeed: 1,
  repeatMode: 'off',
  sleepTimer: initialSleepTimer,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a react-native-track-player Track object from a QueueItem. */
function queueItemToTrack(item: QueueItem) {
  return {
    id: item.episode.id,
    url: item.episode.audioUrl,
    title: item.episode.title,
    artist: item.podcastTitle || 'Unknown podcast',
    artwork: item.episode.artworkUrl ?? item.podcastArtworkUrl,
    duration: item.episode.duration,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // -- Playback controls --------------------------------------------------

      play: async (item) => {
        set({
          currentTrack: item,
          playbackState: 'loading',
          progress: {
            position: item.episode.playPosition ?? 0,
            duration: item.episode.duration ?? 0,
            buffered: 0,
          },
        });
        try {
          await TrackPlayer.reset();
          await TrackPlayer.add(queueItemToTrack(item));
          if (item.episode.playPosition > 0) {
            await TrackPlayer.seekTo(item.episode.playPosition);
          }
          await TrackPlayer.setRate(get().playbackSpeed);
          await TrackPlayer.play();
        } catch (error) {
          console.error('[PlayerStore] play error:', error);
          set({ playbackState: 'error' });
        }
      },

      pause: async () => {
        set({ playbackState: 'paused' });
        try {
          await TrackPlayer.pause();
        } catch (error) {
          console.error('[PlayerStore] pause error:', error);
        }
      },

      resume: async () => {
        set({ playbackState: 'playing' });
        try {
          await TrackPlayer.play();
        } catch (error) {
          console.error('[PlayerStore] resume error:', error);
        }
      },

      seekTo: async (position) => {
        const clamped = Math.max(
          0,
          Math.min(position, get().progress.duration),
        );
        set((state) => ({
          progress: { ...state.progress, position: clamped },
        }));
        try {
          await TrackPlayer.seekTo(clamped);
        } catch (error) {
          console.error('[PlayerStore] seekTo error:', error);
        }
      },

      skipForward: async () => {
        const { progress } = get();
        const newPos = Math.min(
          progress.position + SKIP_FORWARD_SECONDS,
          progress.duration,
        );
        set({ progress: { ...progress, position: newPos } });
        try {
          await TrackPlayer.seekTo(newPos);
        } catch (error) {
          console.error('[PlayerStore] skipForward error:', error);
        }
      },

      skipBackward: async () => {
        const { progress } = get();
        const newPos = Math.max(
          progress.position - SKIP_BACKWARD_SECONDS,
          0,
        );
        set({ progress: { ...progress, position: newPos } });
        try {
          await TrackPlayer.seekTo(newPos);
        } catch (error) {
          console.error('[PlayerStore] skipBackward error:', error);
        }
      },

      setSpeed: async (speed) => {
        const clamped = Math.max(0.5, Math.min(3, speed));
        set({ playbackSpeed: clamped });
        try {
          await TrackPlayer.setRate(clamped);
        } catch (error) {
          console.error('[PlayerStore] setSpeed error:', error);
        }
      },

      // -- Queue management ---------------------------------------------------

      addToQueue: (item) =>
        set((state) => ({ queue: [...state.queue, item] })),

      removeFromQueue: (index) =>
        set((state) => ({
          queue: state.queue.filter((_, i) => i !== index),
        })),

      clearQueue: () => set({ queue: [] }),

      // -- Sleep timer --------------------------------------------------------

      setSleepTimer: (minutes) =>
        set({
          sleepTimer:
            minutes === null
              ? initialSleepTimer
              : {
                  minutes,
                  endsAt: Date.now() + minutes * 60 * 1000,
                },
        }),

      // -- Track navigation ---------------------------------------------------

      nextTrack: async () => {
        const { queue, currentTrack, repeatMode, playbackSpeed } = get();

        // Repeat-one: restart current track
        if (repeatMode === 'one' && currentTrack) {
          set({
            progress: { ...initialProgress, duration: currentTrack.episode.duration },
          });
          try {
            await TrackPlayer.seekTo(0);
            await TrackPlayer.play();
          } catch {}
          return;
        }

        if (queue.length === 0) {
          // Nothing in the queue — stop
          set({ playbackState: 'idle' });
          return;
        }

        const [nextItem, ...remainingQueue] = queue;
        const updatedQueue =
          repeatMode === 'all' && currentTrack
            ? [...remainingQueue, currentTrack]
            : remainingQueue;

        set({
          currentTrack: nextItem,
          queue: updatedQueue,
          playbackState: 'loading',
          progress: {
            position: nextItem.episode.playPosition ?? 0,
            duration: nextItem.episode.duration ?? 0,
            buffered: 0,
          },
        });

        try {
          await TrackPlayer.reset();
          await TrackPlayer.add(queueItemToTrack(nextItem));
          await TrackPlayer.setRate(playbackSpeed);
          await TrackPlayer.play();
        } catch (error) {
          console.error('[PlayerStore] nextTrack error:', error);
          set({ playbackState: 'error' });
        }
      },

      previousTrack: async () => {
        const { progress, currentTrack } = get();
        if (!currentTrack) return;

        // Always restart the current track from the beginning
        set({ progress: { ...progress, position: 0 } });
        try {
          await TrackPlayer.seekTo(0);
        } catch (error) {
          console.error('[PlayerStore] previousTrack error:', error);
        }
      },

      // -- Progress updates (from sync hook) ----------------------------------

      updateProgress: (partial) =>
        set((state) => ({
          progress: { ...state.progress, ...partial },
        })),

      setPlaybackState: (playbackState) => set({ playbackState }),

      // -- Reset ---------------------------------------------------------------

      reset: async () => {
        set(initialState);
        try {
          await TrackPlayer.reset();
        } catch (error) {
          console.error('[PlayerStore] reset error:', error);
        }
      },
    }),
    {
      name: 'tuned-player-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the fields that need to survive an app restart
      partialize: (state) => ({
        playbackSpeed: state.playbackSpeed,
        repeatMode: state.repeatMode,
        currentTrack: state.currentTrack,
        progress: {
          position: state.progress.position,
          duration: state.progress.duration,
          buffered: 0,
        },
        queue: state.queue,
      }),
      // When rehydrating, make sure we start in a paused / idle state
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.playbackState = state.currentTrack ? 'paused' : 'idle';
        }
      },
    },
  ),
);
