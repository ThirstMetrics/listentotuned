/**
 * Tuned Podcast Player - EmptyState Component
 *
 * Centered placeholder shown when a list or screen has no content.
 * Renders an icon, title, subtitle, and an optional action button.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { darkColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import Button from './Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  /** Emoji or icon character displayed above the title. */
  icon: string;
  title: string;
  subtitle?: string;
  /** Label for the optional CTA button. */
  actionLabel?: string;
  /** Handler for the optional CTA button. */
  onAction?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle != null && subtitle.length > 0 && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {actionLabel != null && onAction != null && (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant="primary" size="md" />
        </View>
      )}
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
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  action: {
    marginTop: spacing.sm,
  },
});

export default EmptyState;
