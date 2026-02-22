/**
 * Tuned Podcast Player - Root Navigator
 *
 * Top-level native stack that hosts:
 *   - MainTabs (bottom tab navigator, the default view)
 *   - NowPlaying (full-screen modal, slides up from bottom)
 *   - PodcastDetail & EpisodeDetail (push transitions)
 *   - Settings (push transition)
 *   - Auth (modal presentation)
 *
 * All screens use the dark color palette by default. Push screens receive a
 * styled header; the tab navigator and modal screens hide theirs.
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import MainTabNavigator from './MainTabNavigator';
import NowPlayingScreen from '../screens/NowPlaying/NowPlayingScreen';
import PodcastDetailScreen from '../screens/PodcastDetail/PodcastDetailScreen';
import EpisodeDetailScreen from '../screens/EpisodeDetail/EpisodeDetailScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import AuthScreen from '../screens/Auth/AuthScreen';

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        // Default header styling for push screens
        headerStyle: {
          backgroundColor: '#1E293B',
        },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerShadowVisible: false,
        // Dark status bar content
        statusBarStyle: 'light',
        // Enable swipe-to-go-back on iOS by default
        gestureEnabled: true,
        // Match the dark background during transitions
        contentStyle: {
          backgroundColor: '#0F172A',
        },
        animation: 'default',
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Main Tabs (no header -- tabs have their own headers)              */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Now Playing - full-screen modal (slides up from bottom)           */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          // On iOS the modal card has rounded corners and reduced backdrop
          ...(Platform.OS === 'ios' && {
            presentation: 'fullScreenModal',
          }),
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Podcast Detail - push transition with back button                 */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="PodcastDetail"
        component={PodcastDetailScreen}
        options={{
          title: 'Podcast',
          animation: 'default',
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Episode Detail - push transition with back button                 */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="EpisodeDetail"
        component={EpisodeDetailScreen}
        options={{
          title: 'Episode',
          animation: 'default',
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Settings - push transition                                        */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          animation: 'default',
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Auth - modal presentation (sign-in / sign-up)                     */}
      {/* ----------------------------------------------------------------- */}
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
