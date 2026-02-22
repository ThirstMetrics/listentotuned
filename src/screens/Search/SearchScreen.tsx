/**
 * Tuned Podcast Player - Search Screen
 *
 * Full-featured search screen with debounced search, category filtering,
 * trending podcasts, and search results display.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Navigation
import { useAppNavigation } from '../../navigation/types';

// Types
import type { Podcast, SearchResult } from '../../types';

// Stores
import { usePodcastStore } from '../../stores/podcastStore';

// Components
import SearchBar from '../../components/common/SearchBar';
import PodcastCard from '../../components/podcast/PodcastCard';
import CategoryChip from '../../components/common/CategoryChip';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// Theme
import { darkColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamilies, fontSizes, fontWeights, lineHeights } from '../../theme/typography';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'All',
  'Comedy',
  'Technology',
  'News',
  'True Crime',
  'Business',
  'Health',
  'Science',
  'Education',
  'Sports',
] as const;

const DEBOUNCE_MS = 400;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SearchScreen: React.FC = () => {
  const navigation = useAppNavigation();

  const {
    searchResults,
    searchQuery,
    isSearching,
    trendingPodcasts,
    isTrendingLoading,
    searchPodcasts,
    clearSearch,
    fetchTrending,
  } = usePodcastStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inputText, setInputText] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch trending podcasts on mount if the list is empty
  useEffect(() => {
    if (trendingPodcasts.length === 0) {
      fetchTrending();
    }
  }, []);

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------

  const handleSearchChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (text.trim().length === 0) {
        clearSearch();
        return;
      }

      debounceTimer.current = setTimeout(() => {
        searchPodcasts(text);
      }, DEBOUNCE_MS);
    },
    [searchPodcasts, clearSearch],
  );

  const handleCategorySelect = useCallback(
    (category: string) => {
      setSelectedCategory(category);

      if (category === 'All') {
        clearSearch();
        setInputText('');
      } else {
        setInputText(category);
        searchPodcasts(category);
      }
    },
    [searchPodcasts, clearSearch],
  );

  const handlePodcastPress = useCallback(
    (podcast: Podcast) => {
      navigation.navigate('PodcastDetail', {
        podcastId: podcast.id,
        podcast,
      });
    },
    [navigation],
  );

  // -------------------------------------------------------------------
  // List helpers
  // -------------------------------------------------------------------

  const renderPodcastItem = useCallback(
    ({ item }: { item: Podcast }) => (
      <PodcastCard
        podcast={item}
        variant="list"
        onPress={() => handlePodcastPress(item)}
      />
    ),
    [handlePodcastPress],
  );

  const keyExtractor = useCallback((item: Podcast) => item.id, []);

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Determine which dataset to show
  const isDefaultView = !searchQuery && selectedCategory === 'All';
  const hasResults = searchResults.length > 0;
  const searchPodcasts_ = searchResults.map((r: SearchResult) => r.podcast);
  const data = isDefaultView ? trendingPodcasts : searchPodcasts_;
  const showLoading = isSearching || (isDefaultView && isTrendingLoading);

  // -------------------------------------------------------------------
  // List header
  // -------------------------------------------------------------------

  const ListHeader = useCallback(() => {
    if (showLoading) {
      return null;
    }

    if (isDefaultView) {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>Popular podcasts</Text>
        </View>
      );
    }

    if (hasResults && searchQuery) {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.resultsInfoText}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}{' '}
            for &apos;{searchQuery}&apos;
          </Text>
        </View>
      );
    }

    return null;
  }, [isDefaultView, showLoading, hasResults, searchQuery, searchResults.length]);

  // -------------------------------------------------------------------
  // List empty
  // -------------------------------------------------------------------

  const ListEmpty = useCallback(() => {
    if (showLoading) {
      return (
        <View style={styles.centeredContainer}>
          <LoadingSpinner />
        </View>
      );
    }

    if (searchQuery && !hasResults) {
      return (
        <EmptyState
          icon={'\uD83D\uDD0D'}
          title="No podcasts found"
          subtitle="Try a different search term"
        />
      );
    }

    return null;
  }, [showLoading, searchQuery, hasResults]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <SearchBar value={inputText} onChangeText={handleSearchChange} />
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            label={category}
            selected={selectedCategory === category}
            onPress={() => handleCategorySelect(category)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      <FlatList
        data={showLoading ? [] : data}
        renderItem={renderPodcastItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
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
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.heading,
    color: darkColors.textPrimary,
    lineHeight: lineHeights['2xl'],
  },

  // Search bar
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // Categories
  categoriesScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing['2xl'],
  },

  // Section header
  sectionHeaderContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionHeaderText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.heading,
    color: darkColors.textPrimary,
    lineHeight: lineHeights.lg,
  },
  resultsInfoText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.body,
    color: darkColors.textSecondary,
    lineHeight: lineHeights.sm,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: darkColors.border,
    marginHorizontal: spacing.lg,
  },

  // Centered container for spinner / empty state
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
});

export default SearchScreen;
