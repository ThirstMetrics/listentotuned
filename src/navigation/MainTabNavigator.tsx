/**
 * Tuned Podcast Player - Main Tab Navigator
 *
 * Bottom tab navigator with four primary destinations:
 *   Home  |  Search  |  Library  |  Profile
 *
 * The MiniPlayer is rendered directly above the tab bar when a track is
 * active, using the tabBar render prop.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
  BottomTabBar,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { MainTabParamList } from './types';
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import LibraryScreen from '../screens/Library/LibraryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ConnectedMiniPlayer from '../components/player/ConnectedMiniPlayer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_ICON_SIZE = 24;

/** Base tab bar height before adding safe-area bottom inset. */
const TAB_BAR_BASE_HEIGHT = Platform.select({ ios: 56, android: 60 }) ?? 60;

/**
 * Map each tab route name to its Ionicons glyph pair (focused / unfocused).
 */
const TAB_ICONS: Record<
  keyof MainTabParamList,
  { focused: string; unfocused: string }
> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Search: { focused: 'search', unfocused: 'search-outline' },
  Library: { focused: 'library', unfocused: 'library-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

// ---------------------------------------------------------------------------
// Custom Tab Bar (with MiniPlayer above)
// ---------------------------------------------------------------------------

function TabBarWithMiniPlayer(props: BottomTabBarProps) {
  return (
    <View>
      <ConnectedMiniPlayer />
      <BottomTabBar {...props} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <TabBarWithMiniPlayer {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconSet = TAB_ICONS[route.name];
          const iconName = focused ? iconSet.focused : iconSet.unfocused;
          return (
            <Ionicons
              name={iconName}
              size={size ?? TAB_ICON_SIZE}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            // Add safe-area bottom padding for devices with a home indicator
            height: TAB_BAR_BASE_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Library' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E293B',
    borderTopColor: '#334155',
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0, // Remove Android shadow
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  tabBarItem: {
    paddingTop: 6,
  },
});

export default MainTabNavigator;
