/**
 * Tuned Podcast Player - Episode Detail Screen
 *
 * Displays full episode information including artwork, metadata, show notes,
 * playback controls, and download status. Supports expanding/collapsing
 * the description section.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppNavigation, useAppRoute } from '../../navigation/types';
import { usePodcastStore } from '../../stores/podcastStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useDownloadStore } from '../../stores/downloadStore';
import {
  formatDurationHuman,
  formatRelativeDate,
  formatFileSize,
  stripHtml,
} from '../../utils/formatters';

import PlayButton from '../../components/player/PlayButton';
import DownloadButton from '../../components/player/DownloadButton';
import Button from '../../components/common/Button';

import { darkColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';

import type { Episode, Podcast } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTWORK_SIZE = 200;
const DESCRIPTION_COLLAPSED_LINES = 3;

// ---------------------------------------------------------------------------
// Fallback podcast when episode's parent is not in subscriptions
// ---------------------------------------------------------------------------

const FALLBACK_PODCAST: Podcast = {
  id: '',
  title: 'Unknown Podcast',
  author: 'Unknown Author',
  description: '',
  artworkUrl: '',
  feedUrl: '',
  categories: [],
  episodeCount: 0,
  lastEpisodeDate: null,
  language: 'en',
  explicit: false,
  websiteUrl: null,
  rating: null,
  ratingCount: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EpisodeDetailScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'EpisodeDetail'>();
  const { episodeId, episode: routeEpisode } = route.params;

  // ---- Stores ----
  const subscriptions = usePodcastStore((s) => s.subscriptions);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playbackState = usePlayerStore((s) => s.playbackState);
  const playerPlay = usePlayerStore((s) => s.play);
  const downloads = useDownloadStore((s) => s.downloads);
  const startDownload = useDownloadStore((s) => s.startDownload);
  const removeDownload = useDownloadStore((s) => s.removeDownload);
  const isDownloaded = useDownloadStore((s) => s.isDownloaded);

  // ---- Local state ----
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // ---- Resolve episode ----
  // The episode may come via route params, or we need to find it in store cache
  const episode: Episode | undefined = useMemo(() => {
    if (routeEpisode) return routeEpisode;

    // Search episodesByPodcast cache in podcastStore
    const episodesByPodcast = usePodcastStore.getState().episodesByPodcast;
    for (const podcastId of Object.keys(episodesByPodcast)) {
      const found = episodesByPodcast[podcastId]?.find(
        (ep) => ep.id === episodeId,
      );
      if (found) return found;
    }

    // Search recent episodes
    const recentEpisodes = usePodcastStore.getState().recentEpisodes;
    return recentEpisodes.find((ep) => ep.id === episodeId);
  }, [routeEpisode, episodeId]);

  // ---- Resolve parent podcast ----
  const podcast: Podcast = useMemo(() => {
    if (!episode) return FALLBACK_PODCAST;
    const found = subscriptions.find((p) => p.id === episode.podcastId);
    return found ?? { ...FALLBACK_PODCAST, id: episode.podcastId };
  }, [episode, subscriptions]);

  // ---- Derived state ----
  const isCurrentlyPlaying = useMemo(() => {
    if (!currentTrack || !episode) return false;
    return (
      currentTrack.episode.id === episode.id && playbackState === 'playing'
    );
  }, [currentTrack, episode, playbackState]);

  const downloadEntry = episode ? downloads[episode.id] : undefined;

  const downloadStatus: 'none' | 'downloading' | 'downloaded' = useMemo(() => {
    if (!episode) return 'none';
    if (isDownloaded(episode.id)) return 'downloaded';
    if (
      downloadEntry &&
      (downloadEntry.status === 'queued' ||
        downloadEntry.status === 'downloading' ||
        downloadEntry.status === 'paused')
    ) {
      return 'downloading';
    }
    return 'none';
  }, [episode, downloadEntry, isDownloaded]);

  const strippedDescription = useMemo(() => {
    if (!episode?.description) return '';
    return stripHtml(episode.description);
  }, [episode?.description]);

  const artworkUri = episode?.artworkUrl || podcast.artworkUrl || undefined;

  // ---- Handlers ----

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handlePlayPress = useCallback(() => {
    if (!episode) return;
    playerPlay({
      episode,
      podcastTitle: podcast.title,
      podcastAuthor: podcast.author,
      podcastArtworkUrl: podcast.artworkUrl,
    });
  }, [episode, podcast, playerPlay]);

  const handleDownloadPress = useCallback(() => {
    if (!episode) return;
    if (downloadStatus === 'downloaded') {
      removeDownload(episode.id);
    } else if (downloadStatus === 'none') {
      startDownload(episode);
    }
    // If downloading, could cancel — but the DownloadButton component handles UX
  }, [episode, downloadStatus, removeDownload, startDownload]);

  const handleToggleDescription = useCallback(() => {
    setIsDescriptionExpanded((prev) => !prev);
  }, []);

  // ---- Guard: no episode found ----
  if (!episode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleGoBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Episode</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Episode not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Build metadata chips ----
  const metadataItems: string[] = [];
  if (episode.duration) {
    metadataItems.push(formatDurationHuman(episode.duration));
  }
  if (episode.pubDate) {
    metadataItems.push(formatRelativeDate(episode.pubDate));
  }
  if (episode.season != null && episode.episodeNumber != null) {
    metadataItems.push(`S${episode.season} E${episode.episodeNumber}`);
  } else if (episode.season != null) {
    metadataItems.push(`Season ${episode.season}`);
  } else if (episode.episodeNumber != null) {
    metadataItems.push(`Episode ${episode.episodeNumber}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleGoBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Text style={styles.backIcon}>{'\u2039'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Episode</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Artwork */}
        <View style={styles.artworkContainer}>
          {artworkUri ? (
            <Image
              source={{ uri: artworkUri }}
              style={styles.artwork}
              resizeMode="cover"
              accessibilityLabel={`${episode.title} artwork`}
            />
          ) : (
            <View style={[styles.artwork, styles.artworkPlaceholder]}>
              <Text style={styles.artworkPlaceholderText}>{'\u266B'}</Text>
            </View>
          )}
        </View>

        {/* Title & Podcast Name */}
        <Text style={styles.episodeTitle} numberOfLines={3}>
          {episode.title}
        </Text>
        <Pressable
          onPress={() =>
            navigation.navigate('PodcastDetail', {
              podcastId: podcast.id,
              podcast: podcast.id ? podcast : undefined,
            })
          }
          accessibilityRole="link"
          accessibilityLabel={`Go to ${podcast.title}`}
        >
          <Text style={styles.podcastName} numberOfLines={1}>
            {podcast.title}
          </Text>
        </Pressable>

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {metadataItems.map((item, index) => (
            <React.Fragment key={item}>
              {index > 0 && <Text style={styles.metadataSeparator}>{'\u00B7'}</Text>}
              <Text style={styles.metadataText}>{item}</Text>
            </React.Fragment>
          ))}
          {episode.explicit && (
            <>
              {metadataItems.length > 0 && (
                <Text style={styles.metadataSeparator}>{'\u00B7'}</Text>
              )}
              <View style={styles.explicitBadge}>
                <Text style={styles.explicitText}>E</Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <View style={styles.playButtonRow}>
            <Button
              title={isCurrentlyPlaying ? 'Playing' : 'Play Episode'}
              onPress={handlePlayPress}
              variant="primary"
              size="lg"
              fullWidth
              icon={
                <PlayButton
                  isPlaying={isCurrentlyPlaying}
                  onPress={handlePlayPress}
                  size="sm"
                  variant="ghost"
                />
              }
            />
          </View>
          <View style={styles.downloadButtonContainer}>
            <DownloadButton
              status={downloadStatus}
              progress={downloadEntry?.progress ?? 0}
              onPress={handleDownloadPress}
            />
          </View>
        </View>

        {/* Show Notes */}
        {strippedDescription.length > 0 && (
          <View style={styles.showNotesContainer}>
            <Text style={styles.sectionHeader}>Show Notes</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={isDescriptionExpanded ? undefined : DESCRIPTION_COLLAPSED_LINES}
            >
              {strippedDescription}
            </Text>
            <Pressable
              onPress={handleToggleDescription}
              accessibilityRole="button"
              accessibilityLabel={
                isDescriptionExpanded ? 'Show less' : 'Show more'
              }
              hitSlop={8}
            >
              <Text style={styles.showMoreText}>
                {isDescriptionExpanded ? 'Show less' : 'Show more'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* File Info */}
        <View style={styles.fileInfoContainer}>
          {episode.fileSize != null && episode.fileSize > 0 && (
            <View style={styles.fileInfoRow}>
              <Text style={styles.fileInfoLabel}>File size</Text>
              <Text style={styles.fileInfoValue}>
                {formatFileSize(episode.fileSize)}
              </Text>
            </View>
          )}
          {episode.mimeType && (
            <View style={styles.fileInfoRow}>
              <Text style={styles.fileInfoLabel}>Format</Text>
              <Text style={styles.fileInfoValue}>{episode.mimeType}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.border,
  },
  backButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    color: darkColors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: spacing['4xl'],
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['5xl'],
  },

  // Artwork
  artworkContainer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.xl,
  },
  artworkPlaceholder: {
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 64,
    color: darkColors.textMuted,
  },

  // Title & Podcast Name
  episodeTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  podcastName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.medium,
    color: darkColors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Metadata Row
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing['2xl'],
  },
  metadataText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
  },
  metadataSeparator: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: darkColors.textMuted,
    marginHorizontal: spacing.sm,
  },
  explicitBadge: {
    backgroundColor: darkColors.surfaceHover,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  explicitText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.bold,
    color: darkColors.textSecondary,
  },

  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    gap: spacing.md,
  },
  playButtonRow: {
    flex: 1,
  },
  downloadButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Show Notes
  showNotesContainer: {
    marginBottom: spacing['3xl'],
  },
  sectionHeader: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
  },
  showMoreText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.primary,
    marginTop: spacing.sm,
  },

  // File Info
  fileInfoContainer: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  fileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  fileInfoLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },
  fileInfoValue: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.medium,
    color: darkColors.textMuted,
  },
});

export default EpisodeDetailScreen;
