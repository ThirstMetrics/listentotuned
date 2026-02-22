import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';
import { usePlayerStore } from '../stores/playerStore';

export async function setupTrackPlayer() {
  let isSetup = false;

  try {
    await TrackPlayer.getActiveTrack();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 50, // 50MB cache
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventInterval: 1,
      forwardJumpInterval: 30,
      backwardJumpInterval: 15,
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Off);
    isSetup = true;
  }

  return isSetup;
}

export async function playbackService() {
  // -- Remote control events (lock screen / notification) -------------------

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    // Advance via the store so the queue is managed correctly
    usePlayerStore.getState().nextTrack();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().previousTrack();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    const position = await TrackPlayer.getProgress().then((p) => p.position);
    await TrackPlayer.seekTo(position + event.interval);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    const position = await TrackPlayer.getProgress().then((p) => p.position);
    await TrackPlayer.seekTo(Math.max(0, position - event.interval));
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
    } else if (event.permanent) {
      await TrackPlayer.stop();
    } else {
      await TrackPlayer.play();
    }
  });

  // -- Auto-advance when a track finishes -----------------------------------
  // The store manages its own queue (TrackPlayer holds one track at a time).
  // When the current track ends, advance to the next item in the store queue.

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    const store = usePlayerStore.getState();
    if (store.queue.length > 0 || store.repeatMode !== 'off') {
      await store.nextTrack();
    }
  });
}
