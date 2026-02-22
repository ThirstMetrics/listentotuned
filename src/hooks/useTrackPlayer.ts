import { useEffect, useState } from 'react';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  useActiveTrack,
  State,
} from 'react-native-track-player';
import { setupTrackPlayer } from '../services/trackPlayerService';

export function useTrackPlayerSetup() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setupTrackPlayer().then((ready) => setIsReady(ready));
  }, []);

  return isReady;
}

export function useIsPlaying() {
  const state = usePlaybackState();
  return {
    isPlaying: state.state === State.Playing,
    isBuffering:
      state.state === State.Buffering || state.state === State.Loading,
    isPaused: state.state === State.Paused,
    isStopped:
      state.state === State.None || state.state === State.Stopped,
  };
}

export function usePlayerProgress() {
  const progress = useProgress(250);
  return {
    position: progress.position,
    duration: progress.duration,
    buffered: progress.buffered,
  };
}

export function useCurrentTrack() {
  return useActiveTrack();
}

export async function playEpisode(episode: {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string;
  podcastTitle?: string;
  duration?: number;
}) {
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: episode.id,
    url: episode.audioUrl,
    title: episode.title,
    artist: episode.podcastTitle || 'Unknown podcast',
    artwork: episode.artworkUrl,
    duration: episode.duration,
  });
  await TrackPlayer.play();
}

export async function addToQueue(episode: {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string;
  podcastTitle?: string;
  duration?: number;
}) {
  await TrackPlayer.add({
    id: episode.id,
    url: episode.audioUrl,
    title: episode.title,
    artist: episode.podcastTitle || 'Unknown podcast',
    artwork: episode.artworkUrl,
    duration: episode.duration,
  });
}
