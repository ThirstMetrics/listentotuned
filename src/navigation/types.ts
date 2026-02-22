/**
 * Tuned Podcast Player - Navigation Type Definitions
 *
 * Central type definitions for the entire navigation graph.
 * Uses React Navigation v7 typed hooks for full type-safety across screens.
 */

import type {
  NavigationProp,
  RouteProp,
  CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { Podcast, Episode } from '../types';

// ---------------------------------------------------------------------------
// Root Stack (native stack navigator)
// Contains the bottom tabs as the main screen, plus modal / push overlays.
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  /** Bottom tab navigator (Home, Search, Library, Profile) */
  MainTabs: undefined;
  /** Full-screen modal player (slides up from bottom) */
  NowPlaying: undefined;
  /** Podcast detail page (show, episode list, subscribe CTA) */
  PodcastDetail: { podcastId: string; podcast?: Podcast };
  /** Single episode detail (show notes, chapters, playback) */
  EpisodeDetail: { episodeId: string; episode?: Episode };
  /** App settings */
  Settings: undefined;
  /** Authentication flow (sign-in / sign-up modal) */
  Auth: undefined;
};

// ---------------------------------------------------------------------------
// Bottom Tab Navigator
// ---------------------------------------------------------------------------

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

// ---------------------------------------------------------------------------
// Composite Navigation Props
// ---------------------------------------------------------------------------

/**
 * Navigation prop available inside any tab screen.
 * Merges tab-level actions (jumpTo) with root-stack actions (navigate to
 * modals / push screens).
 */
export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

// ---------------------------------------------------------------------------
// Screen-level Props (shorthand generics for each screen)
// ---------------------------------------------------------------------------

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: MainTabNavigationProp<T>;
  route: RouteProp<MainTabParamList, T>;
};

// ---------------------------------------------------------------------------
// Typed Hooks
// ---------------------------------------------------------------------------

/**
 * Typed `useNavigation` hook for the root stack.
 * Use this from any screen that needs to navigate to root-level destinations
 * (e.g. opening the NowPlaying modal, pushing PodcastDetail).
 *
 * @example
 * const navigation = useAppNavigation();
 * navigation.navigate('NowPlaying');
 */
export function useAppNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

/**
 * Typed `useRoute` hook. Pass the screen name as a generic to get the
 * correct `params` type.
 *
 * @example
 * const route = useAppRoute<'PodcastDetail'>();
 * const { podcastId } = route.params;
 */
export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>();
}

// ---------------------------------------------------------------------------
// Deep Linking Config
// ---------------------------------------------------------------------------

/**
 * Mapping of screen names to URL path segments for deep linking.
 * Used by the NavigationContainer linking config.
 */
export const linkingScreenConfig = {
  screens: {
    MainTabs: {
      screens: {
        Home: 'home',
        Search: 'search',
        Library: 'library',
        Profile: 'profile',
      },
    },
    NowPlaying: 'now-playing',
    PodcastDetail: 'podcast/:podcastId',
    EpisodeDetail: 'episode/:episodeId',
    Settings: 'settings',
    Auth: 'auth',
  },
} as const;
