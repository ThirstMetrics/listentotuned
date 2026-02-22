/**
 * Tuned Podcast Player - Podcast Detail Screen
 *
 * Displays full podcast information, expandable description, subscribe CTA,
 * and a scrollable list of episodes. Uses FlatList with a ListHeaderComponent
 * for the hero / description / subscribe sections, with EpisodeCard items.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppNavigation, useAppRoute } from '../../navigation/types';
import { usePodcastStore } from '../../stores/podcastStore';
import { usePlayerStore } from '../../stores/playerStore';

import EpisodeCard from '../../components/podcast/EpisodeCard';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

import type { Episode, Podcast } from '../../types';

import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTWORK_SIZE = 120;
const DESCRIPTION_MAX_LINES = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PodcastDetailScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'PodcastDetail'>();
  const { podcastId, podcast: routePodcast } = route.params;

  // -- Store selectors -------------------------------------------------------

  const subscriptions = usePodcastStore((s) => s.subscriptions);
  const episodesByPodcast = usePodcastStore((s) => s.episodesByPodcast);
  const isLoading = usePodcastStore((s) => s.isLoading);
  const error = usePodcastStore((s) => s.error);
  const subscribe = usePodcastStore((s) => s.subscribe);
  const unsubscribe = usePodcastStore((s) => s.unsubscribe);
  const isSubscribedFn = usePodcastStore((s) => s.isSubscribed);
  const getEpisodes = usePodcastStore((s) => s.getEpisodes);

  const playerPlay = usePlayerStore((s) => s.play);

  // -- Local state -----------------------------------------------------------

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Resolve the podcast object: prefer route param, fall back to subscriptions
  const podcast: Podcast | undefined = useMemo(() => {
    if (routePodcast) return routePodcast;
    return subscriptions.find((p) => p.id === podcastId);
  }, [routePodcast, subscriptions, podcastId]);

  const isSubscribed = isSubscribedFn(podcastId);
  const episodes = episodesByPodcast[podcastId] ?? [];

  // -- Effects ---------------------------------------------------------------

  useEffect(() => {
    getEpisodes(podcastId);
  }, [podcastId, getEpisodes]);

  // -- Handlers (all wrapped in useCallback) ---------------------------------

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(async () => {
    if (!podcast) return;
    try {
      await Share.share({
        message: `Check out "${podcast.title}" by ${podcast.author}`,
        url: podcast.websiteUrl ?? podcast.feedUrl,
      });
    } catch {
      // User cancelled or share failed -- no-op
    }
  }, [podcast]);

  const handleToggleSubscribe = useCallback(() => {
    if (!podcast) return;
    if (isSubscribed) {
      unsubscribe(podcastId);
    } else {
      subscribe(podcast);
    }
  }, [podcast, isSubscribed, podcastId, subscribe, unsubscribe]);

  const handleToggleDescription = useCallback(() => {
    setDescriptionExpanded((prev) => !prev);
  }, []);

  const handlePlayEpisode = useCallback(
    (episode: Episode) => {
      if (!podcast) return;

      playerPlay({
        episode,
        podcastTitle: podcast.title,
        podcastAuthor: podcast.author,
        podcastArtworkUrl: podcast.artworkUrl,
      });
    },
    [podcast, playerPlay],
  );

  const handleEpisodePress = useCallback(
    (episode: Episode) => {
      navigation.navigate('EpisodeDetail', {
        episodeId: episode.id,
        episode,
      });
    },
    [navigation],
  );

  // -- Render helpers --------------------------------------------------------

  const renderCategoryBadge = useCallback(
    (category: { id: string; name: string; icon: string }) => (
      <View key={category.id} style={styles.categoryBadge}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>
    ),
    [],
  );

  const renderListHeader = useCallback(() => {
    if (!podcast) return null;

    return (
      <View style={styles.headerContent}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: podcast.artworkUrl }}
            style={styles.artwork}
            accessibilityIgnoresInvertColors
            accessibilityLabel={`${podcast.title} artwork`}
          />
          <Text style={styles.podcastTitle} numberOfLines={2}>
            {podcast.title}
          </Text>
          <Text style={styles.podcastAuthor} numberOfLines={1}>
            {podcast.author}
          </Text>

          {/* Category badges */}
          {podcast.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {podcast.categories.slice(0, 3).map(renderCategoryBadge)}
            </View>
          )}

          {/* Meta row: episode count + language */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {podcast.episodeCount} episode{podcast.episodeCount !== 1 ? 's' : ''}
            </Text>
            {podcast.language ? (
              <>
                <Text style={styles.metaDot}>{'\u00B7'}</Text>
                <Text style={styles.metaText}>
                  {podcast.language.toUpperCase()}
                </Text>
              </>
            ) : null}
            {podcast.rating != null && podcast.rating > 0 ? (
              <>
                <Text style={styles.metaDot}>{'\u00B7'}</Text>
                <Text style={styles.metaText}>
                  {'\u2605'} {podcast.rating.toFixed(1)}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Description section */}
        {podcast.description.length > 0 && (
          <View style={styles.descriptionSection}>
            <Text
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : DESCRIPTION_MAX_LINES}
            >
              {podcast.description}
            </Text>
            <Pressable
              onPress={handleToggleDescription}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                descriptionExpanded ? 'Show less description' : 'Show more description'
              }
            >
              <Text style={styles.showMoreText}>
                {descriptionExpanded ? 'Show less' : 'Show more'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Subscribe button */}
        <View style={styles.subscribeSection}>
          <Button
            title={isSubscribed ? 'Subscribed' : 'Subscribe'}
            onPress={handleToggleSubscribe}
            variant={isSubscribed ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
          />
        </View>

        {/* Episodes section header */}
        <View style={styles.episodesHeader}>
          <Text style={styles.episodesHeaderText}>
            Episodes ({episodes.length})
          </Text>
        </View>
      </View>
    );
  }, [
    podcast,
    descriptionExpanded,
    isSubscribed,
    episodes.length,
    handleToggleDescription,
    handleToggleSubscribe,
    renderCategoryBadge,
  ]);

  const renderEpisodeItem = useCallback(
    ({ item }: { item: Episode }) => {
      if (!podcast) return null;
      const progress =
        item.duration > 0 ? item.playPosition / item.duration : 0;

      return (
        <EpisodeCard
          episode={item}
          podcast={podcast}
          onPress={() => handleEpisodePress(item)}
          onPlay={() => handlePlayEpisode(item)}
          playProgress={progress}
        />
      );
    },
    [podcast, handleEpisodePress, handlePlayEpisode],
  );

  const keyExtractor = useCallback((item: Episode) => item.id, []);

  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return <LoadingSpinner size="large" />;
    }
    if (error) {
      return (
        <EmptyState
          icon={'\u26A0'}
          title="Failed to load episodes"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => getEpisodes(podcastId)}
        />
      );
    }
    return (
      <EmptyState
        icon={'\uD83C\uDFA7'}
        title="No episodes yet"
        subtitle="This podcast has no episodes available."
      />
    );
  }, [isLoading, error, getEpisodes, podcastId]);

  // -- Early return: no podcast data at all ----------------------------------

  if (!podcast) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navBar}>
          <Pressable
            onPress={handleGoBack}
            style={styles.navButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.navButtonText}>{'\u2039'}</Text>
          </Pressable>
          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle} numberOfLines={1}>
              Podcast
            </Text>
          </View>
          <View style={styles.navButton} />
        </View>
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <EmptyState
            icon={'\uD83D\uDD0D'}
            title="Podcast not found"
            subtitle="This podcast could not be loaded."
            actionLabel="Go back"
            onAction={handleGoBack}
          />
        )}
      </SafeAreaView>
    );
  }

  // -- Main render -----------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navigation bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={handleGoBack}
          style={styles.navButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.navButtonText}>{'\u2039'}</Text>
        </Pressable>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {podcast.title}
          </Text>
        </View>
        <Pressable
          onPress={handleShare}
          style={styles.navButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Share podcast"
        >
          <Text style={styles.shareButtonText}>{'\u2191'}</Text>
        </Pressable>
      </View>

      {/* Episode list with header */}
      <FlatList
        data={episodes}
        renderItem={renderEpisodeItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Item Separator
// ---------------------------------------------------------------------------

const ItemSeparator: React.FC = () => <View style={styles.separator} />;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // -- Navigation bar --------------------------------------------------------
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.border,
  },
  navButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    fontWeight: fontWeights.regular,
    color: darkColors.textPrimary,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  navTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
  },
  shareButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.medium,
    color: darkColors.textPrimary,
  },

  // -- List ------------------------------------------------------------------
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing['4xl'],
  },

  // -- Header content --------------------------------------------------------
  headerContent: {
    paddingBottom: spacing.sm,
  },

  // -- Hero section ----------------------------------------------------------
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.xl,
    backgroundColor: darkColors.surfaceHover,
    marginBottom: spacing.lg,
  },
  podcastTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.bold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  podcastAuthor: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.medium,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // -- Category badges -------------------------------------------------------
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.border,
  },
  categoryIcon: {
    fontSize: fontSizes.sm,
    marginRight: spacing.xs,
  },
  categoryName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    color: darkColors.textSecondary,
  },

  // -- Meta row --------------------------------------------------------------
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },
  metaDot: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: darkColors.textMuted,
    marginHorizontal: spacing.sm,
  },

  // -- Description -----------------------------------------------------------
  descriptionSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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

  // -- Subscribe button ------------------------------------------------------
  subscribeSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // -- Episodes header -------------------------------------------------------
  episodesHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: darkColors.border,
  },
  episodesHeaderText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
  },

  // -- Separator -------------------------------------------------------------
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.border,
    marginHorizontal: spacing.lg,
  },
});

export default PodcastDetailScreen;
