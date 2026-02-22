/**
 * Tuned Podcast Player - LoadingSpinner Component
 *
 * Centered ActivityIndicator with brand primary color.
 * Supports a fullScreen mode that fills the entire screen.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { darkColors } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingSpinnerProps {
  /** ActivityIndicator size. Defaults to 'large'. */
  size?: 'small' | 'large';
  /** Override spinner color. Defaults to brand primary. */
  color?: string;
  /** When true, the spinner fills the entire screen with the dark background. */
  fullScreen?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = darkColors.primary,
  fullScreen = false,
}) => {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkColors.background,
  },
});

export default LoadingSpinner;
