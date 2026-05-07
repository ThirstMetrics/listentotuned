/**
 * Tuned Podcast Player - Navigation Entry Point
 *
 * Wraps the root navigator inside a NavigationContainer with:
 *   - Custom dark theme matching the Tuned design system
 *   - Deep linking support (tuned:// scheme)
 *   - Typed exports for use throughout the app
 */

import React from 'react';
import { StatusBar } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  type Theme,
} from '@react-navigation/native';

import RootNavigator from './RootNavigator';
import { linkingScreenConfig } from './types';

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Custom dark theme that overrides React Navigation's built-in DarkTheme
 * with the Tuned brand palette.
 */
const tunedDarkTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#4F46E5',      // Indigo 600
    background: '#0F172A',   // Slate 900
    card: '#1E293B',         // Slate 800 (headers, tab bar, drawers)
    text: '#F8FAFC',         // Slate 50
    border: '#334155',       // Slate 700
    notification: '#4F46E5', // Indigo 600 (badge color)
  },
};

// ---------------------------------------------------------------------------
// Deep Linking
// ---------------------------------------------------------------------------

/**
 * Deep linking configuration.
 *
 * Supports the following URL patterns:
 *   tuned://home
 *   tuned://search
 *   tuned://library
 *   tuned://profile
 *   tuned://now-playing
 *   tuned://podcast/:podcastId
 *   tuned://episode/:episodeId
 *   tuned://settings
 *   tuned://auth
 */
const linking: any = {
  prefixes: ['tuned://', 'https://tuned.app'],
  config: linkingScreenConfig,
};

// ---------------------------------------------------------------------------
// Navigation Provider
// ---------------------------------------------------------------------------

/**
 * Top-level navigation provider. Wrap your App component with this.
 *
 * @example
 * ```tsx
 * import { NavigationProvider } from './src/navigation';
 *
 * function App() {
 *   return (
 *     <SafeAreaProvider>
 *       <NavigationProvider />
 *     </SafeAreaProvider>
 *   );
 * }
 * ```
 */
const NavigationProvider: React.FC = () => {
  return (
    <NavigationContainer theme={tunedDarkTheme} linking={linking}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <RootNavigator />
    </NavigationContainer>
  );
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { NavigationProvider };
export default NavigationProvider;

// Re-export navigation types and hooks for convenience
export type {
  RootStackParamList,
  MainTabParamList,
  RootStackScreenProps,
  MainTabScreenProps,
  MainTabNavigationProp,
} from './types';

export { useAppNavigation, useAppRoute } from './types';
