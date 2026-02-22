/**
 * Tuned Podcast Player - PlayButton Component
 *
 * Circular play / pause toggle button.
 *
 * Sizes:
 *   sm  - 32 dp diameter
 *   md  - 48 dp diameter
 *   lg  - 72 dp diameter
 *
 * Variants:
 *   primary - indigo background with white icon
 *   ghost   - transparent background with white icon
 */

import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { darkColors } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlayButtonSize = 'sm' | 'md' | 'lg';
export type PlayButtonVariant = 'primary' | 'ghost';

export interface PlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: PlayButtonSize;
  variant?: PlayButtonVariant;
}

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

interface SizeConfig {
  diameter: number;
  iconFontSize: number;
}

const sizeMap: Record<PlayButtonSize, SizeConfig> = {
  sm: { diameter: 32, iconFontSize: 14 },
  md: { diameter: 48, iconFontSize: 20 },
  lg: { diameter: 72, iconFontSize: 30 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying,
  onPress,
  size = 'md',
  variant = 'primary',
}) => {
  const config = sizeMap[size];
  const isPrimary = variant === 'primary';

  const containerStyle: ViewStyle = {
    width: config.diameter,
    height: config.diameter,
    borderRadius: config.diameter / 2,
    backgroundColor: isPrimary ? darkColors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Unicode symbols for play / pause
  const icon = isPlaying ? '\u275A\u275A' : '\u25B6';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
    >
      <Text
        style={[
          styles.icon,
          {
            fontSize: config.iconFontSize,
            color: '#FFFFFF',
          },
        ]}
      >
        {icon}
      </Text>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    // Slight optical centering for play triangle
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default PlayButton;
