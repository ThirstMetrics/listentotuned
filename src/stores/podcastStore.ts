/**
 * Tuned Podcast Player - Podcast Store
 *
 * Manages podcast subscriptions, trending lists, recent episodes, search,
 * and category metadata. Subscriptions are persisted to MMKV so they survive
 * app restarts without hitting the network.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Category, Episode, Podcast, SearchResult } from '../types/podcast';
import { podcastIndexService } from '../services/podcastIndexService';
import { mmkvStorage } from './mmkvStorage';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface PodcastState {
  subscriptions: Podcast[];
  trendingPodcasts: Podcast[];
  recentEpisodes: Episode[];
  categories: Category[];
  /** Cached episodes keyed by podcastId */
  episodesByPodcast: Record<string, Episode[]>;
  /** Search results from most recent query */
  searchResults: SearchResult[];
  searchQuery: string;
  isLoading: boolean;
  isSearching: boolean;
  isTrendingLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface PodcastActions {
  subscribe: (podcast: Podcast) => void;
  unsubscribe: (podcastId: string) => void;
  isSubscribed: (podcastId: string) => boolean;
  fetchTrending: (max?: number, cat?: string) => Promise<void>;
  fetchSubscriptionFeed: () => Promise<void>;
  refreshPodcast: (podcastId: string) => Promise<void>;
  getEpisodes: (podcastId: string) => Promise<Episode[]>;
  searchPodcasts: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchCategories: () => Promise<void>;
  setCategories: (categories: Category[]) => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: PodcastState = {
  subscriptions: [],
  trendingPodcasts: [],
  recentEpisodes: [],
  categories: [],
  episodesByPodcast: {},
  searchResults: [],
  searchQuery: '',
  isLoading: false,
  isSearching: false,
  isTrendingLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePodcastStore = create<PodcastState & PodcastActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // -- Subscriptions ------------------------------------------------------

      subscribe: (podcast) =>
        set((state) => {
          const alreadySubscribed = state.subscriptions.some(
            (p) => p.id === podcast.id,
          );
          if (alreadySubscribed) return state;
          return { subscriptions: [...state.subscriptions, podcast] };
        }),

      unsubscribe: (podcastId) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((p) => p.id !== podcastId),
        })),

      isSubscribed: (podcastId) =>
        get().subscriptions.some((p) => p.id === podcastId),

      // -- Fetching -----------------------------------------------------------

      fetchTrending: async (max = 25, cat) => {
        set({ isTrendingLoading: true, error: null });
        try {
          const podcasts = await podcastIndexService.getTrending(max, cat);
          set({ trendingPodcasts: podcasts, isTrendingLoading: false });
        } catch (err) {
          set({
            isTrendingLoading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to fetch trending podcasts',
          });
        }
      },

      fetchSubscriptionFeed: async () => {
        const subs = get().subscriptions;
        if (subs.length === 0) {
          set({ recentEpisodes: [] });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Fetch latest episodes from each subscription (limit to first 10 subs to avoid rate limits)
          const feedPromises = subs.slice(0, 10).map((podcast) =>
            podcastIndexService
              .getEpisodesByFeedId(Number(podcast.id), 5)
              .catch(() => [] as Episode[]),
          );
          const episodeArrays = await Promise.all(feedPromises);
          const allEpisodes = episodeArrays
            .flat()
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
            .slice(0, 50);

          set({ recentEpisodes: allEpisodes, isLoading: false });
        } catch (err) {
          set({
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to fetch subscription feed',
          });
        }
      },

      refreshPodcast: async (podcastId) => {
        set({ isLoading: true, error: null });
        try {
          const podcast = await podcastIndexService.getPodcastById(Number(podcastId));
          set((state) => ({
            subscriptions: state.subscriptions.map((p) =>
              p.id === podcastId ? podcast : p,
            ),
            isLoading: false,
          }));
        } catch (err) {
          set({
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to refresh podcast',
          });
        }
      },

      getEpisodes: async (podcastId) => {
        const cached = get().episodesByPodcast[podcastId];
        if (cached && cached.length > 0) return cached;

        set({ isLoading: true, error: null });
        try {
          const episodes = await podcastIndexService.getEpisodesByFeedId(
            Number(podcastId),
            50,
          );
          set((state) => ({
            episodesByPodcast: {
              ...state.episodesByPodcast,
              [podcastId]: episodes,
            },
            isLoading: false,
          }));
          return episodes;
        } catch (err) {
          set({
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to fetch episodes',
          });
          return [];
        }
      },

      // -- Search -------------------------------------------------------------

      searchPodcasts: async (query) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return;
        }

        set({ isSearching: true, searchQuery: query, error: null });
        try {
          const results = await podcastIndexService.searchPodcasts(query, 30);
          set({ searchResults: results, isSearching: false });
        } catch (err) {
          set({
            isSearching: false,
            error:
              err instanceof Error
                ? err.message
                : 'Search failed',
          });
        }
      },

      clearSearch: () =>
        set({ searchResults: [], searchQuery: '', isSearching: false }),

      // -- Categories ---------------------------------------------------------

      fetchCategories: async () => {
        try {
          const categories = await podcastIndexService.getCategories();
          set({ categories });
        } catch {
          // Non-critical — silently fall back to empty categories
        }
      },

      setCategories: (categories) => set({ categories }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tuned-podcast-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        categories: state.categories,
      }),
    },
  ),
);
