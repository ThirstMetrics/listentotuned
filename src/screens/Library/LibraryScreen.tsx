/**
 * Tuned Podcast Player - Library Screen
 *
 * Displays the user's podcast subscriptions and downloaded episodes
 * across two tabs: "Subscriptions" (grid layout) and "Downloads" (list layout).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from '../../navigation/types';
import { useAppNavigation } from '../../navigation/types';
import type { Episode, Podcast } from '../../types';
import { usePodcastStore } from '../../stores/podcastStore';
import { useDownloadStore, type DownloadEntry } from '../../stores/downloadStore';
import PodcastCard from '../../components/podcast/PodcastCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

type LibraryTab = 'subscriptions' | 'downloads';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formats bytes into a human-readable file size string. */
function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Returns a human-readable label for a download status. */
function formatDownloadStatus(status: DownloadEntry['status']): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'downloading':
      return 'Downloading';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Downloaded';
    case 'error':
      return 'Error';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Sub-component: Download Item
// ---------------------------------------------------------------------------

interface DownloadItemProps {
  entry: DownloadEntry;
  subscriptions: Podcast[];
  recentEpisodes: Episode[];
  onPress: (entry: DownloadEntry) => void;
  onRemove: (episodeId: string) => void;
}

const DownloadItem: React.FC<DownloadItemProps> = React.memo(
  ({ entry, subscriptions, recentEpisodes, onPress, onRemove }) => {
    // Try to find the episode title from recent episodes
    const episode = recentEpisodes.find((ep) => ep.id === entry.episodeId);
    const podcast = episode
      ? subscriptions.find((p) => p.id === episode.podcastId)
      : undefined;

    const episodeTitle = episode?.title ?? `Episode ${entry.episodeId}`;
    const podcastTitle = podcast?.title ?? 'Unknown Podcast';
    const isCompleted = entry.status === 'completed';
    const isError = entry.status === 'error';
    const isInProgress = entry.status === 'downloading';

    const handlePress = useCallback(() => {
      onPress(entry);
    }, [entry, onPress]);

    const handleRemove = useCallback(() => {
      onRemove(entry.episodeId);
    }, [entry.episodeId, onRemove]);

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.downloadItem,
          pressed && styles.downloadItemPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${episodeTitle}, ${podcastTitle}`}
      >
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadTitle} numberOfLines={2}>
            {episodeTitle}
          </Text>
          <Text style={styles.downloadPodcast} numberOfLines={1}>
            {podcastTitle}
          </Text>
          <View style={styles.downloadMeta}>
            <Text
              style={[
                styles.downloadStatus,
                isCompleted && styles.downloadStatusCompleted,
                isError && styles.downloadStatusError,
              ]}
            >
              {formatDownloadStatus(entry.status)}
            </Text>
            {entry.fileSize != null && entry.fileSize > 0 && (
              <>
                <Text style={styles.downloadDot}>{'\u00B7'}</Text>
                <Text style={styles.downloadSize}>
                  {formatFileSize(entry.fileSize)}
                </Text>
              </>
            )}
          </View>

          {/* Progress bar for active downloads */}
          {isInProgress && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(entry.progress * 100)}%` },
                ]}
              />
            </View>
          )}

          {/* Error message */}
          {isError && entry.errorMessage != null && (
            <Text style={styles.errorMessage} numberOfLines={1}>
              {entry.errorMessage}
            </Text>
          )}
        </View>

        {/* Remove button for completed or errored downloads */}
        {(isCompleted || isError) && (
          <Pressable
            onPress={handleRemove}
            style={styles.removeButton}
            accessibilityRole="button"
            accessibilityLabel={`Remove download for ${episodeTitle}`}
            hitSlop={8}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        )}
      </Pressable>
    );
  },
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const LibraryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('subscriptions');

  const appNavigation = useAppNavigation();
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList, 'Library'>>();

  // -- Store selectors -------------------------------------------------------

  const subscriptions = usePodcastStore((state) => state.subscriptions);
  const recentEpisodes = usePodcastStore((state) => state.recentEpisodes);
  const isLoading = usePodcastStore((state) => state.isLoading);
  const fetchSubscriptionFeed = usePodcastStore(
    (state) => state.fetchSubscriptionFeed,
  );

  const downloads = useDownloadStore((state) => state.downloads);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  // -- Derived data ----------------------------------------------------------

  const downloadEntries = useMemo(() => {
    return Object.values(downloads);
  }, [downloads]);

  // -- Effects ---------------------------------------------------------------

  useEffect(() => {
    fetchSubscriptionFeed();
  }, [fetchSubscriptionFeed]);

  // -- Handlers --------------------------------------------------------------

  const handlePodcastPress = useCallback(
    (podcast: Podcast) => {
      appNavigation.navigate('PodcastDetail', {
        podcastId: podcast.id,
        podcast,
      });
    },
    [appNavigation],
  );

  const handleExplorePress = useCallback(() => {
    tabNavigation.navigate('Search');
  }, [tabNavigation]);

  const handleDownloadPress = useCallback(
    (entry: DownloadEntry) => {
      const episode = recentEpisodes.find((ep) => ep.id === entry.episodeId);
      if (episode) {
        appNavigation.navigate('EpisodeDetail', {
          episodeId: episode.id,
          episode,
        });
      }
    },
    [appNavigation, recentEpisodes],
  );

  const handleRemoveDownload = useCallback(
    (episodeId: string) => {
      removeDownload(episodeId);
    },
    [removeDownload],
  );

  const handleSelectSubscriptions = useCallback(() => {
    setActiveTab('subscriptions');
  }, []);

  const handleSelectDownloads = useCallback(() => {
    setActiveTab('downloads');
  }, []);

  // -- Render helpers --------------------------------------------------------

  const renderPodcastItem = useCallback(
    ({ item }: { item: Podcast }) => (
      <View style={styles.podcastGridItem}>
        <PodcastCard
          podcast={item}
          variant="grid"
          onPress={() => handlePodcastPress(item)}
        />
      </View>
    ),
    [handlePodcastPress],
  );

  const renderDownloadItem = useCallback(
    ({ item }: { item: DownloadEntry }) => (
      <DownloadItem
        entry={item}
        subscriptions={subscriptions}
        recentEpisodes={recentEpisodes}
        onPress={handleDownloadPress}
        onRemove={handleRemoveDownload}
      />
    ),
    [subscriptions, recentEpisodes, handleDownloadPress, handleRemoveDownload],
  );

  const podcastKeyExtractor = useCallback(
    (item: Podcast) => item.id,
    [],
  );

  const downloadKeyExtractor = useCallback(
    (item: DownloadEntry) => item.episodeId,
    [],
  );

  // -- Render ----------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={handleSelectSubscriptions}
          style={[
            styles.tab,
            activeTab === 'subscriptions' && styles.tabActive,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'subscriptions' }}
          accessibilityLabel="Subscriptions"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'subscriptions' && styles.tabTextActive,
            ]}
          >
            Subscriptions
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSelectDownloads}
          style={[
            styles.tab,
            activeTab === 'downloads' && styles.tabActive,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'downloads' }}
          accessibilityLabel="Downloads"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'downloads' && styles.tabTextActive,
            ]}
          >
            Downloads
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'subscriptions' ? (
        isLoading && subscriptions.length === 0 ? (
          <LoadingSpinner />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No subscriptions yet"
            subtitle="Browse trending podcasts to find something you like"
            actionLabel="Explore"
            onAction={handleExplorePress}
          />
        ) : (
          <FlatList
            data={subscriptions}
            renderItem={renderPodcastItem}
            keyExtractor={podcastKeyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.podcastGridRow}
            contentContainerStyle={styles.podcastGridContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : downloadEntries.length === 0 ? (
        <EmptyState
          icon="📥"
          title="No downloads"
          subtitle="Download episodes to listen offline"
        />
      ) : (
        <FlatList
          data={downloadEntries}
          renderItem={renderDownloadItem}
          keyExtractor={downloadKeyExtractor}
          contentContainerStyle={styles.downloadListContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={DownloadSeparator}
        />
      )}
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Separator component for download list
// ---------------------------------------------------------------------------

const DownloadSeparator: React.FC = () => <View style={styles.separator} />;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // -- Header ----------------------------------------------------------------
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.bold,
    color: darkColors.textPrimary,
  },

  // -- Tab Bar ---------------------------------------------------------------
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: darkColors.primary,
  },
  tabText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.textSecondary,
  },
  tabTextActive: {
    color: darkColors.textPrimary,
  },

  // -- Subscriptions Grid ----------------------------------------------------
  podcastGridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  podcastGridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  podcastGridItem: {
    width: 160,
  },

  // -- Downloads List --------------------------------------------------------
  downloadListContent: {
    paddingBottom: spacing['3xl'],
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  downloadItemPressed: {
    opacity: 0.8,
  },
  downloadInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  downloadTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: 2,
  },
  downloadPodcast: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginBottom: spacing.xs,
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadStatus: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    color: darkColors.textMuted,
  },
  downloadStatusCompleted: {
    color: darkColors.success,
  },
  downloadStatusError: {
    color: darkColors.danger,
  },
  downloadDot: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: darkColors.textMuted,
    marginHorizontal: spacing.xs,
  },
  downloadSize: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
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
  errorMessage: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    color: darkColors.danger,
    marginTop: spacing.xs,
  },
  removeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  removeButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.semibold,
    color: darkColors.textSecondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.border,
    marginHorizontal: spacing.lg,
  },
});

export default LibraryScreen;
