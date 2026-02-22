/**
 * Tuned Podcast Player - TrackPlayer ↔ Store Sync Hook
 *
 * Bridges react-native-track-player's reactive hooks with the Zustand
 * playerStore. Must be mounted inside a React component that lives for
 * the lifetime of the app (e.g. a dedicated <TrackPlayerSyncManager />
 * rendered in App.tsx).
 *
 * Responsibilities:
 *   1. Map RNTP playback state → store.setPlaybackState()
 *   2. Forward RNTP progress → store.updateProgress()
 *   3. Check and fire the sleep timer when it expires
 */

import { useEffect, useRef } from 'react';
import {
  usePlaybackState,
  useProgress,
  State,
} from 'react-native-track-player';
import { usePlayerStore } from '../stores/playerStore';
import type { PlaybackState } from '../types/player';

// ---------------------------------------------------------------------------
// State mapping
// ---------------------------------------------------------------------------

function mapTPState(tpState: State | undefined): PlaybackState {
  switch (tpState) {
    case State.Playing:
      return 'playing';
    case State.Paused:
      return 'paused';
    case State.Buffering:
    case State.Loading:
      return 'buffering';
    case State.Stopped:
    case State.None:
    case State.Ended:
      return 'idle';
    case State.Error:
      return 'error';
    default:
      return 'idle';
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTrackPlayerSync() {
  const { state: tpState } = usePlaybackState();
  const progress = useProgress(500);

  // Ref to avoid re-setting the same state repeatedly
  const lastMappedState = useRef<PlaybackState>('idle');

  // ----- Sync playback state ------------------------------------------------
  useEffect(() => {
    const mapped = mapTPState(tpState);

    // Avoid redundant store writes
    if (mapped === lastMappedState.current) return;
    lastMappedState.current = mapped;

    usePlayerStore.getState().setPlaybackState(mapped);
  }, [tpState]);

  // ----- Sync progress ------------------------------------------------------
  useEffect(() => {
    // Only push when there's meaningful progress data
    if (progress.duration <= 0 && progress.position <= 0) return;

    usePlayerStore.getState().updateProgress({
      position: progress.position,
      duration: progress.duration,
      buffered: progress.buffered,
    });
  }, [progress.position, progress.duration, progress.buffered]);

  // ----- Sleep timer ---------------------------------------------------------
  const sleepEndsAt = usePlayerStore((s) => s.sleepTimer.endsAt);

  useEffect(() => {
    if (sleepEndsAt === null) return;

    const remaining = sleepEndsAt - Date.now();

    if (remaining <= 0) {
      // Timer already expired
      usePlayerStore.getState().pause();
      usePlayerStore.getState().setSleepTimer(null);
      return;
    }

    const timeout = setTimeout(() => {
      usePlayerStore.getState().pause();
      usePlayerStore.getState().setSleepTimer(null);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [sleepEndsAt]);
}
