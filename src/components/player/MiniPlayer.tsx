/**
 * Tuned Podcast Player - MiniPlayer Component
 *
 * Sticky bottom bar (positioned above the tab bar) showing the currently
 * playing episode. Displays small artwork, episode title, podcast name,
 * play/pause toggle, and a thin progress line at the top.
 *
 * Only renders when the player store has an active track.
 * Tapping the bar area calls onPress (to open the full NowPlaying modal).
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { layout } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import PlayButton from './PlayButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MiniPlayerProps {
  /** Episode title */
  title: string;
  /** Podcast name */
  podcastName: string;
  /** Artwork URI */
  artworkUrl: string;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** 0-1 float for the progress bar */
  progress: number;
  /** Play / pause toggle */
  onPlayPause: () => void;
  /** Tap the bar to open full player */
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTWORK_SIZE = 40;
const PROGRESS_BAR_HEIGHT = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  title,
  podcastName,
  artworkUrl,
  isPlaying,
  progress,
  onPlayPause,
  onPress,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Thin progress bar at top */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
          ]}
        />
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Now playing: ${title} by ${podcastName}`}
      >
        {/* Artwork */}
        <Image
          source={{ uri: artworkUrl }}
          style={styles.artwork}
          accessibilityIgnoresInvertColors
        />

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.podcastName} numberOfLines={1}>
            {podcastName}
          </Text>
        </View>

        {/* Play / Pause button */}
        <PlayButton
          isPlaying={isPlaying}
          onPress={onPlayPause}
          size="sm"
          variant="ghost"
        />
      </Pressable>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: darkColors.surface,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: darkColors.surfaceHover,
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkColors.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.miniPlayerHeight - PROGRESS_BAR_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.sm,
    backgroundColor: darkColors.surfaceHover,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
  },
  podcastName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
  },
  pressed: {
    opacity: 0.9,
  },
});

export default MiniPlayer;
