/**
 * Tuned Podcast Player - CategoryChip Component
 *
 * Pill-shaped chip used for podcast category filters.
 * Selected state: primary indigo background.
 * Unselected state: surface background with border.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { fontFamilies, fontSizes, fontWeights, lineHeights } from '../../theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  selected = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} category`}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: darkColors.primary,
  },
  chipUnselected: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelUnselected: {
    color: darkColors.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default CategoryChip;
