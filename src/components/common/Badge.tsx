/**
 * Tuned Podcast Player - Badge Component
 *
 * Tier badges displayed next to user names or in profile screens.
 * - free  : renders nothing (no badge for free tier)
 * - premium: indigo background with sparkle icon
 * - pro   : violet-to-indigo gradient-style (solid violet as gradient
 *           requires a third-party lib; we use the violet brand color)
 * - business: warm amber / gold
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { darkColors, brandColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { fontFamilies, fontSizes, fontWeights, lineHeights } from '../../theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeTier = 'free' | 'premium' | 'pro' | 'business';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  tier: BadgeTier;
  size?: BadgeSize;
}

// ---------------------------------------------------------------------------
// Config per tier
// ---------------------------------------------------------------------------

interface TierConfig {
  label: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
}

const tierConfigs: Record<Exclude<BadgeTier, 'free'>, TierConfig> = {
  premium: {
    label: 'Premium',
    icon: '\u2728', // sparkle unicode
    backgroundColor: brandColors.primary,
    textColor: '#FFFFFF',
  },
  pro: {
    label: 'Pro',
    icon: '\u26A1', // lightning bolt
    backgroundColor: brandColors.violet,
    textColor: '#FFFFFF',
  },
  business: {
    label: 'Business',
    icon: '\uD83D\uDC51', // crown
    backgroundColor: brandColors.secondary,
    textColor: '#0F172A',
  },
};

const sizeMap: Record<BadgeSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    text: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
    },
  },
  md: {
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
    },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Badge: React.FC<BadgeProps> = ({ tier, size = 'sm' }) => {
  if (tier === 'free') {
    return null;
  }

  const config = tierConfigs[tier];
  const sStyle = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        sStyle.container,
        { backgroundColor: config.backgroundColor },
      ]}
      accessibilityLabel={`${config.label} tier badge`}
    >
      <Text style={[styles.icon, sStyle.text]}>{config.icon}</Text>
      <Text style={[styles.label, sStyle.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.semibold,
  },
});

export default Badge;
