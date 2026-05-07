/**
 * Tuned Podcast Player - Home Screen
 *
 * The main landing screen showing trending podcasts, subscriptions,
 * recent episodes, and category browsing.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Navigation
import { useAppNavigation } from '../../navigation/types';

// Types
import type { Podcast, Episode } from '../../types';

// Stores
import { usePodcastStore } from '../../stores/podcastStore';

// Components
import PodcastCard from '../../components/podcast/PodcastCard';
import EpisodeCard from '../../components/podcast/EpisodeCard';
import CategoryChip from '../../components/common/CategoryChip';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// Theme
import { darkColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PODCAST_CARD_GAP = 12;

const BROWSE_CATEGORIES = [
  'Comedy',
  'Technology',
  'News',
  'True Crime',
  'Business',
  'Health',
  'Science',
  'Education',
  'Sports',
  'Music',
  'Society',
  'History',
];

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && onAction && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </Pressable>
    )}
  </View>
);

// ---------------------------------------------------------------------------
// Settings Icon (inline SVG-free gear icon using Unicode)
// ---------------------------------------------------------------------------

const SettingsIcon: React.FC = () => (
  <Text style={styles.settingsIcon}>{'\u2699'}</Text>
);

// ---------------------------------------------------------------------------
// Fallback podcast for episodes without a matched subscription
// ---------------------------------------------------------------------------

const UNKNOWN_PODCAST: Podcast = {
  id: 'unknown',
  title: 'Unknown Podcast',
  author: '',
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
// Home Screen
// ---------------------------------------------------------------------------

const HomeScreen: React.FC = () => {
  const navigation = useAppNavigation();

  const {
    subscriptions,
    trendingPodcasts,
    recentEpisodes,
    isTrendingLoading,
    fetchTrending,
    fetchSubscriptionFeed,
  } = usePodcastStore();

  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      fetchSubscriptionFeed();
    }
  }, [subscriptions.length, fetchSubscriptionFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTrending(),
        subscriptions.length > 0 ? fetchSubscriptionFeed() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrending, fetchSubscriptionFeed, subscriptions.length]);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------

  const handlePodcastPress = useCallback(
    (podcast: Podcast) => {
      navigation.navigate('PodcastDetail', {
        podcastId: podcast.id,
        podcast,
      });
    },
    [navigation],
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings' as any);
  }, [navigation]);

  // -----------------------------------------------------------------------
  // Look-up helper: find parent podcast for an episode
  // -----------------------------------------------------------------------

  const findPodcastForEpisode = useCallback(
    (episode: Episode): Podcast =>
      subscriptions.find(
        (p: Podcast) => p.id === episode.podcastId,
      ) ?? UNKNOWN_PODCAST,
    [subscriptions],
  );

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderTrendingItem = useCallback(
    ({ item }: { item: Podcast }) => (
      <PodcastCard
        podcast={item}
        variant="grid"
        onPress={() => handlePodcastPress(item)}
      />
    ),
    [handlePodcastPress],
  );

  const renderSubscriptionItem = useCallback(
    ({ item }: { item: Podcast }) => (
      <PodcastCard
        podcast={item}
        variant="grid"
        onPress={() => handlePodcastPress(item)}
      />
    ),
    [handlePodcastPress],
  );

  const keyExtractorPodcast = useCallback(
    (item: Podcast) => `podcast-${item.id}`,
    [],
  );

  const keyExtractorSubscription = useCallback(
    (item: Podcast) => `sub-${item.id}`,
    [],
  );

  const trendingItemSeparator = useCallback(
    () => <View style={{ width: PODCAST_CARD_GAP }} />,
    [],
  );

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ---- Fixed Header ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tuned</Text>
        <Pressable
          onPress={handleSettingsPress}
          hitSlop={8}
          style={styles.settingsButton}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <SettingsIcon />
        </Pressable>
      </View>

      {/* ---- Scrollable Content ---- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkColors.textSecondary}
            colors={[darkColors.primary]}
          />
        }
      >
        {/* ------------------------------------------------------------ */}
        {/* Trending                                                      */}
        {/* ------------------------------------------------------------ */}
        <View style={styles.section}>
          <SectionHeader
            title="Trending"
            actionLabel="See all"
            onAction={() => {
              /* Navigate to full trending list in the future */
            }}
          />

          {isTrendingLoading && trendingPodcasts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
            </View>
          ) : trendingPodcasts.length > 0 ? (
            <FlatList
              horizontal
              data={trendingPodcasts}
              renderItem={renderTrendingItem}
              keyExtractor={keyExtractorPodcast}
              ItemSeparatorComponent={trendingItemSeparator}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
            />
          ) : (
            <View style={styles.emptyTrendingContainer}>
              <EmptyState
                icon={'\uD83D\uDCE1'}
                title="No trending podcasts"
                subtitle="Pull to refresh to load trending content."
              />
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Your Shows (subscriptions)                                    */}
        {/* ------------------------------------------------------------ */}
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Your shows" />

            <FlatList
              horizontal
              data={subscriptions}
              renderItem={renderSubscriptionItem}
              keyExtractor={keyExtractorSubscription}
              ItemSeparatorComponent={trendingItemSeparator}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
            />
          </View>
        )}

        {/* ------------------------------------------------------------ */}
        {/* Latest Episodes                                               */}
        {/* ------------------------------------------------------------ */}
        {subscriptions.length > 0 && recentEpisodes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Latest episodes" />

            <View style={styles.episodesList}>
              {recentEpisodes.map((episode: Episode) => {
                const parentPodcast = findPodcastForEpisode(episode);
                return (
                  <EpisodeCard
                    key={`episode-${episode.id}`}
                    episode={episode}
                    podcast={parentPodcast}
                    onPress={() => {
                      /* Navigate to episode detail in the future */
                    }}
                    onPlay={() => {
                      /* No-op for now */
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------ */}
        {/* Browse Categories                                             */}
        {/* ------------------------------------------------------------ */}
        <View style={styles.section}>
          <SectionHeader title="Browse" />

          <View style={styles.categoriesGrid}>
            {BROWSE_CATEGORIES.map((category) => (
              <CategoryChip
                key={`category-${category}`}
                label={category}
                onPress={() => {
                  /* Navigate to Search tab filtered by category in the future */
                }}
              />
            ))}
          </View>
        </View>

        {/* Bottom spacing so content doesn't hide behind tab bar */}
        <View style={styles.bottomSpacer} />
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
    backgroundColor: darkColors.background,
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.heading,
    color: darkColors.textPrimary,
    lineHeight: lineHeights['2xl'],
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  settingsIcon: {
    fontSize: fontSizes['2xl'],
    color: darkColors.textSecondary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },

  // Sections
  section: {
    marginTop: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.heading,
    color: darkColors.textPrimary,
    lineHeight: lineHeights.xl,
  },
  sectionAction: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.body,
    color: darkColors.primary,
    lineHeight: lineHeights.sm,
  },

  // Horizontal lists
  horizontalListContent: {
    paddingHorizontal: spacing.lg,
  },

  // Loading / empty states for trending
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrendingContainer: {
    paddingHorizontal: spacing.lg,
  },

  // Episodes (vertical list)
  episodesList: {
    paddingHorizontal: spacing.lg,
  },

  // Categories grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  // Bottom spacer
  bottomSpacer: {
    height: spacing['3xl'],
  },
});

export default HomeScreen;
