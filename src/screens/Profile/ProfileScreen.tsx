/**
 * Tuned Podcast Player - Profile Screen
 *
 * Displays user profile information, stats, account menu, and sign-out option
 * when authenticated. Shows a welcome/sign-in prompt when not authenticated.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import { useAppNavigation } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { usePodcastStore } from '../../stores/podcastStore';
import Button from '../../components/common/Button';
import type { UserTier } from '../../types/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuRowProps {
  label: string;
  rightText?: string;
  onPress: () => void;
  isLast?: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MenuRow: React.FC<MenuRowProps> = ({ label, rightText, onPress, isLast = false }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.menuRow,
      !isLast && styles.menuRowBorder,
      pressed && styles.menuRowPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Text style={styles.menuRowLabel}>{label}</Text>
    <View style={styles.menuRowRight}>
      {rightText != null && (
        <Text style={styles.menuRowRightText}>{rightText}</Text>
      )}
      <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
    </View>
  </Pressable>
);

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// Tier badge helpers
// ---------------------------------------------------------------------------

const tierDisplayName: Record<UserTier, string> = {
  free: 'Free',
  premium: 'Premium',
  pro: 'Pro',
};

const tierBadgeColor: Record<UserTier, { bg: string; text: string }> = {
  free: { bg: darkColors.surfaceHover, text: darkColors.textSecondary },
  premium: { bg: 'rgba(245, 158, 11, 0.15)', text: darkColors.warning },
  pro: { bg: 'rgba(79, 70, 229, 0.15)', text: darkColors.primary },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProfileScreen: React.FC = () => {
  const navigation = useAppNavigation();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  const subscriptions = usePodcastStore((s) => s.subscriptions);

  // -- Handlers -------------------------------------------------------------

  const handleNavigateSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleNavigateAuth = useCallback(() => {
    navigation.navigate('Auth');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const handleEditProfile = useCallback(() => {
    // Placeholder - would navigate to an edit profile screen
  }, []);

  const handleSubscriptionPlan = useCallback(() => {
    // Placeholder - would navigate to subscription management
  }, []);

  const handleAbout = useCallback(() => {
    // Placeholder - would navigate to an about screen
  }, []);

  // -- Derived data ---------------------------------------------------------

  const userInitial = useMemo(() => {
    if (!user?.displayName) return '?';
    return user.displayName.charAt(0).toUpperCase();
  }, [user?.displayName]);

  const tierBadge = useMemo(() => {
    const tier = user?.tier ?? 'free';
    return {
      label: tierDisplayName[tier],
      colors: tierBadgeColor[tier],
    };
  }, [user?.tier]);

  // -- Render ---------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={handleNavigateSettings}
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.headerIconButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.headerIconText}>{'\u2699'}</Text>
        </Pressable>
      </View>

      {!isAuthenticated ? (
        /* ----------------------------------------------------------------- */
        /* Unauthenticated State                                             */
        /* ----------------------------------------------------------------- */
        <View style={styles.unauthContainer}>
          {/* Icon illustration */}
          <View style={styles.unauthIconCircle}>
            <Text style={styles.unauthIcon}>{'\u266B'}</Text>
          </View>

          <Text style={styles.unauthTitle}>Welcome to Tuned</Text>
          <Text style={styles.unauthSubtitle}>
            Sign in to sync your subscriptions, track listening history, and
            unlock premium features.
          </Text>

          <View style={styles.unauthButtons}>
            <Button
              title="Sign In"
              onPress={handleNavigateAuth}
              variant="primary"
              size="lg"
              fullWidth
            />
            <View style={styles.unauthButtonSpacer} />
            <Button
              title="Create Account"
              onPress={handleNavigateAuth}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      ) : (
        /* ----------------------------------------------------------------- */
        /* Authenticated State                                               */
        /* ----------------------------------------------------------------- */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header */}
          <View style={styles.profileHeader}>
            {user?.avatarUrl ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{user?.displayName ?? 'User'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tierBadge.colors.bg },
              ]}
            >
              <Text
                style={[
                  styles.tierBadgeText,
                  { color: tierBadge.colors.text },
                ]}
              >
                {tierBadge.label}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard
              label="Subscriptions"
              value={String(subscriptions.length)}
            />
            <StatCard label="Episodes Played" value="0" />
            <StatCard label="Listening Time" value="0h" />
          </View>

          {/* Menu section: Account */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Account</Text>
            <View style={styles.menuGroup}>
              <MenuRow label="Edit Profile" onPress={handleEditProfile} />
              <MenuRow
                label="Subscription Plan"
                rightText={tierBadge.label}
                onPress={handleSubscriptionPlan}
                isLast
              />
            </View>
          </View>

          {/* Menu section: App */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>App</Text>
            <View style={styles.menuGroup}>
              <MenuRow label="Settings" onPress={handleNavigateSettings} />
              <MenuRow label="About Tuned" onPress={handleAbout} isLast />
            </View>
          </View>

          {/* Sign Out */}
          <View style={styles.signOutContainer}>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="danger"
              size="md"
              fullWidth
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // Header ------------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.bold,
    color: darkColors.textPrimary,
  },
  headerIconButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surface,
  },
  headerIconButtonPressed: {
    opacity: 0.7,
  },
  headerIconText: {
    fontSize: fontSizes.xl,
    color: darkColors.textSecondary,
  },

  // Unauthenticated --------------------------------------------------------
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  unauthIconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  unauthIcon: {
    fontSize: 40,
    color: darkColors.primary,
  },
  unauthTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.bold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  unauthSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  unauthButtons: {
    width: '100%',
  },
  unauthButtonSpacer: {
    height: spacing.md,
  },

  // Scroll view -------------------------------------------------------------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  // Profile header ----------------------------------------------------------
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarInitial: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  displayName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginBottom: spacing.md,
  },
  tierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tierBadgeText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.semibold,
  },

  // Stats row ---------------------------------------------------------------
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.bold,
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    color: darkColors.textMuted,
    textAlign: 'center',
  },

  // Menu sections -----------------------------------------------------------
  menuSection: {
    marginBottom: spacing['2xl'],
  },
  menuSectionTitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.semibold,
    color: darkColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuGroup: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.border,
  },
  menuRowPressed: {
    backgroundColor: darkColors.surfaceHover,
  },
  menuRowLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textPrimary,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuRowRightText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },
  menuRowChevron: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.regular,
    color: darkColors.textMuted,
  },

  // Sign out ----------------------------------------------------------------
  signOutContainer: {
    marginTop: spacing.sm,
  },
});

export default ProfileScreen;
