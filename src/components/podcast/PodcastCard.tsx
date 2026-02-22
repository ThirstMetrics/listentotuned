/**
 * Tuned Podcast Player - PodcastCard Component
 *
 * Displays a podcast with artwork, title, author, and episode count.
 * Two variants:
 *   - 'grid'  : vertical card for browse / discovery screens
 *   - 'list'  : horizontal row for search results
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Podcast } from '../../types';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PodcastCardVariant = 'grid' | 'list';

export interface PodcastCardProps {
  podcast: Podcast;
  variant?: PodcastCardVariant;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID_ARTWORK_SIZE = 160;
const LIST_ARTWORK_SIZE = 72;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PodcastCard: React.FC<PodcastCardProps> = ({
  podcast,
  variant = 'grid',
  onPress,
}) => {
  if (variant === 'list') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listContainer, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${podcast.title} by ${podcast.author}`}
      >
        <Image
          source={{ uri: podcast.artworkUrl }}
          style={styles.listArtwork}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {podcast.title}
          </Text>
          <Text style={styles.listAuthor} numberOfLines={1}>
            {podcast.author}
          </Text>
          <Text style={styles.listEpisodes}>
            {podcast.episodeCount} episode{podcast.episodeCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Grid variant (default)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.gridContainer, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${podcast.title} by ${podcast.author}`}
    >
      <Image
        source={{ uri: podcast.artworkUrl }}
        style={styles.gridArtwork}
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.gridTitle} numberOfLines={2}>
        {podcast.title}
      </Text>
      <Text style={styles.gridAuthor} numberOfLines={1}>
        {podcast.author}
      </Text>
      <Text style={styles.gridEpisodes}>
        {podcast.episodeCount} episode{podcast.episodeCount !== 1 ? 's' : ''}
      </Text>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // -- Grid variant --------------------------------------------------------
  gridContainer: {
    width: GRID_ARTWORK_SIZE,
  },
  gridArtwork: {
    width: GRID_ARTWORK_SIZE,
    height: GRID_ARTWORK_SIZE,
    borderRadius: borderRadius.lg,
    backgroundColor: darkColors.surfaceHover,
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: 2,
  },
  gridAuthor: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginBottom: 2,
  },
  gridEpisodes: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },

  // -- List variant --------------------------------------------------------
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  listArtwork: {
    width: LIST_ARTWORK_SIZE,
    height: LIST_ARTWORK_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.surfaceHover,
    marginRight: spacing.md,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: 2,
  },
  listAuthor: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginBottom: 2,
  },
  listEpisodes: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },

  // -- Shared --------------------------------------------------------------
  pressed: {
    opacity: 0.8,
  },
});

export default PodcastCard;
