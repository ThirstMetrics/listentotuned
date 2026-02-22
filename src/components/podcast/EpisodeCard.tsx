/**
 * Tuned Podcast Player - EpisodeCard Component
 *
 * Episode list item displaying small artwork, title (2 lines max), podcast
 * name, duration, date, a play button, a download icon, and an optional
 * progress bar when the episode has been partially played.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Episode, Podcast } from '../../types';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import PlayButton from '../player/PlayButton';
import DownloadButton from '../player/DownloadButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EpisodeCardProps {
  episode: Episode;
  podcast: Podcast;
  onPress?: () => void;
  onPlay?: () => void;
  onDownload?: () => void;
  /** 0-1 float representing how much of the episode has been played. */
  playProgress?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formats seconds into a human-readable string like "1h 23m" or "45 min". */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

/** Formats an ISO date string into a short display like "Jan 15, 2025". */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTWORK_SIZE = 56;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  podcast,
  onPress,
  onPlay,
  onDownload,
  playProgress = 0,
}) => {
  const artworkUri = episode.artworkUrl ?? podcast.artworkUrl;
  const hasProgress = playProgress > 0 && playProgress < 1;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${episode.title}, ${podcast.title}`}
    >
      {/* Artwork */}
      <Image
        source={{ uri: artworkUri }}
        style={styles.artwork}
        accessibilityIgnoresInvertColors
      />

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {episode.title}
        </Text>
        <Text style={styles.podcastName} numberOfLines={1}>
          {podcast.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDuration(episode.duration)}</Text>
          {episode.pubDate.length > 0 && (
            <>
              <Text style={styles.metaDot}>{'\u00B7'}</Text>
              <Text style={styles.metaText}>{formatDate(episode.pubDate)}</Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        {hasProgress && (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.round(playProgress * 100)}%` }]}
            />
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {onPlay != null && (
          <PlayButton
            isPlaying={false}
            onPress={onPlay}
            size="sm"
            variant="ghost"
          />
        )}
        {onDownload != null && (
          <DownloadButton
            status="none"
            progress={0}
            onPress={onDownload}
          />
        )}
      </View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.surfaceHover,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: 2,
  },
  podcastName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },
  metaDot: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: darkColors.textMuted,
    marginHorizontal: spacing.xs,
  },
  progressTrack: {
    height: 3,
    backgroundColor: darkColors.surfaceHover,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.full,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default EpisodeCard;
