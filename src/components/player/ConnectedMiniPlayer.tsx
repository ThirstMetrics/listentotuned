/**
 * Tuned Podcast Player - Connected MiniPlayer
 *
 * Reads from playerStore and wires the presentational MiniPlayer component.
 * Renders nothing when no track is active.
 */

import React, { useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useAppNavigation } from '../../navigation/types';
import MiniPlayer from './MiniPlayer';

const ConnectedMiniPlayer: React.FC = () => {
  const navigation = useAppNavigation();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playbackState = usePlayerStore((s) => s.playbackState);
  const progress = usePlayerStore((s) => s.progress);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);

  const isPlaying = playbackState === 'playing';

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handlePress = useCallback(() => {
    navigation.navigate('NowPlaying');
  }, [navigation]);

  // Don't render when there's no active track
  if (!currentTrack) return null;

  const progressRatio =
    progress.duration > 0 ? progress.position / progress.duration : 0;

  const artworkUrl =
    currentTrack.episode.artworkUrl ?? currentTrack.podcastArtworkUrl ?? '';

  return (
    <MiniPlayer
      title={currentTrack.episode.title}
      podcastName={currentTrack.podcastTitle}
      artworkUrl={artworkUrl}
      isPlaying={isPlaying}
      progress={progressRatio}
      onPlayPause={handlePlayPause}
      onPress={handlePress}
    />
  );
};

export default ConnectedMiniPlayer;
