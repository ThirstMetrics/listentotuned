/**
 * Tuned Podcast Player - Settings Store
 *
 * Manages all user-configurable app settings. Every field is persisted to
 * MMKV so preferences survive app restarts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from './mmkvStorage';

// ---------------------------------------------------------------------------
// Setting value types
// ---------------------------------------------------------------------------

export type ThemePreference = 'dark' | 'light' | 'system';
export type DownloadQuality = 'low' | 'medium' | 'high';
export type SkipForwardOption = 15 | 30 | 60;
export type SkipBackwardOption = 10 | 15 | 30;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface SettingsState {
  /** Visual theme — defaults to 'dark' for a media-consumption app. */
  theme: ThemePreference;
  /** Whether to allow streaming over cellular data. */
  streamOnCellular: boolean;
  /** Audio quality for downloads. */
  downloadQuality: DownloadQuality;
  /** Automatically download new episodes from subscribed podcasts. */
  autoDownload: boolean;
  /** Enable push notifications for new episodes. */
  notifications: boolean;
  /** Seconds to skip forward in the player. */
  skipForwardSeconds: SkipForwardOption;
  /** Seconds to skip backward in the player. */
  skipBackwardSeconds: SkipBackwardOption;
  /** Default playback speed for new episodes (0.5 - 3.0). */
  defaultPlaybackSpeed: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface SettingsActions {
  setTheme: (theme: ThemePreference) => void;
  setStreamOnCellular: (enabled: boolean) => void;
  setDownloadQuality: (quality: DownloadQuality) => void;
  setAutoDownload: (enabled: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  setSkipForwardSeconds: (seconds: SkipForwardOption) => void;
  setSkipBackwardSeconds: (seconds: SkipBackwardOption) => void;
  setDefaultPlaybackSpeed: (speed: number) => void;
  /** Reset every setting to factory defaults. */
  resetToDefaults: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultSettings: SettingsState = {
  theme: 'dark',
  streamOnCellular: true,
  downloadQuality: 'high',
  autoDownload: false,
  notifications: true,
  skipForwardSeconds: 30,
  skipBackwardSeconds: 15,
  defaultPlaybackSpeed: 1,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),

      setStreamOnCellular: (streamOnCellular) => set({ streamOnCellular }),

      setDownloadQuality: (downloadQuality) => set({ downloadQuality }),

      setAutoDownload: (autoDownload) => set({ autoDownload }),

      setNotifications: (notifications) => set({ notifications }),

      setSkipForwardSeconds: (skipForwardSeconds) =>
        set({ skipForwardSeconds }),

      setSkipBackwardSeconds: (skipBackwardSeconds) =>
        set({ skipBackwardSeconds }),

      setDefaultPlaybackSpeed: (speed) =>
        set({ defaultPlaybackSpeed: Math.max(0.5, Math.min(3, speed)) }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'tuned-settings-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Persist the entire settings state
    },
  ),
);
