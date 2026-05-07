/**
 * Tuned - AI-Powered Podcast Player
 * "Stay tuned."
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useTrackPlayerSetup } from './src/hooks/useTrackPlayer';
import { useTrackPlayerSync } from './src/hooks/useTrackPlayerSync';
import authService from './src/services/authService';
import { useAuthStore } from './src/stores/authStore';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme';
import downloadManager from './src/services/downloadManagerService';

const TunedDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4F46E5',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    border: '#334155',
    notification: '#4F46E5',
  },
};

const linking: any = {
  prefixes: ['tuned://', 'https://gettuned.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Search: 'search',
          Library: 'library',
          Profile: 'profile',
        },
      },
      PodcastDetail: 'podcast/:podcastId',
      EpisodeDetail: 'episode/:episodeId',
      NowPlaying: 'now-playing',
      Settings: 'settings',
    },
  },
};

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashTitle}>Tuned</Text>
      <Text style={styles.splashTagline}>Stay tuned.</Text>
      <ActivityIndicator
        size="large"
        color="#4F46E5"
        style={styles.splashSpinner}
      />
    </View>
  );
}

/**
 * Headless component that syncs TrackPlayer state → Zustand playerStore.
 * Mounted only after TrackPlayer is initialized.
 */
function TrackPlayerSyncManager() {
  useTrackPlayerSync();
  return null;
}

function App() {
  const isPlayerReady = useTrackPlayerSetup();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // Add any async initialization here (load fonts, cached data, etc.)
      // Minimum splash display time for branding
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setIsAppReady(true);
    }
    prepare();
  }, []);

  // Keep auth store in sync with Firebase session (handles token refresh,
  // session expiry, sign-out from another device, etc.)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      useAuthStore.getState().setUser(user);
    });
    return unsubscribe;
  }, []);

  // Start download queue processor
  useEffect(() => {
    if (isAppReady) {
      downloadManager.startProcessing();
      return () => downloadManager.stopProcessing();
    }
  }, [isAppReady]);

  if (!isAppReady || !isPlayerReady) {
    return (
      <View style={styles.splash}>
        <SplashScreen />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <TrackPlayerSyncManager />
          <NavigationContainer theme={TunedDarkTheme} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  splashTagline: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 8,
  },
  splashSpinner: {
    marginTop: 32,
  },
});

export default App;
