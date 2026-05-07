/**
 * Tuned Podcast Player - MMKV Storage Adapter for Zustand
 *
 * Creates a Zustand-compatible StateStorage interface backed by react-native-mmkv.
 * MMKV is significantly faster than AsyncStorage for read/write operations,
 * which matters for persisting player state on every position update.
 */

import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// Single MMKV instance shared across all stores (uses a namespaced key per store)
export const mmkv = createMMKV({ id: 'tuned-app-storage' });

/**
 * Zustand-compatible storage adapter that delegates to MMKV.
 *
 * Zustand's persist middleware expects a StateStorage object with
 * getItem / setItem / removeItem — all synchronous with MMKV.
 */
export const mmkvStorage: StateStorage = {
  getItem(name: string): string | null {
    return mmkv.getString(name) ?? null;
  },

  setItem(name: string, value: string): void {
    mmkv.set(name, value);
  },

  removeItem(name: string): void {
    mmkv.remove(name);
  },
};
