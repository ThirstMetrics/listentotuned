/**
 * Tuned Podcast Player - Auth Screen
 *
 * Modal screen providing Sign In and Sign Up flows with tab-based navigation.
 * Dismisses automatically when authentication succeeds.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { darkColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import { useAppNavigation } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthTab = 'signIn' | 'signUp';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuthScreen: React.FC = () => {
  const navigation = useAppNavigation();

  // Auth store
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const clearError = useAuthStore((s) => s.clearError);

  // Local form state
  const [activeTab, setActiveTab] = useState<AuthTab>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Dismiss modal when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.goBack();
    }
  }, [isAuthenticated, navigation]);

  // Clear error when switching tabs
  const handleTabChange = useCallback(
    (tab: AuthTab) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        setResetSent(false);
        clearError();
      }
    },
    [activeTab, clearError],
  );

  // Close button handler
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Sign In handler
  const handleSignIn = useCallback(() => {
    signIn(email.trim(), password);
  }, [signIn, email, password]);

  // Sign Up handler
  const handleSignUp = useCallback(() => {
    signUp(email.trim(), password, displayName.trim());
  }, [signUp, email, password, displayName]);

  // Forgot Password handler
  const handleForgotPassword = useCallback(async () => {
    const trimmed = email.trim();
    if (trimmed.length === 0) return;
    await resetPassword(trimmed);
    setResetSent(true);
  }, [email, resetPassword]);

  // Derived state
  const isSignInDisabled =
    isLoading || email.trim().length === 0 || password.length === 0;
  const isSignUpDisabled =
    isLoading ||
    email.trim().length === 0 ||
    password.length === 0 ||
    displayName.trim().length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with close button */}
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Text style={styles.closeButtonText}>{'\u2715'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>Tuned</Text>
          <Text style={styles.brandTagline}>Stay tuned.</Text>
        </View>

        {/* Tab selector */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => handleTabChange('signIn')}
            style={[
              styles.tab,
              activeTab === 'signIn' && styles.tabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'signIn' }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'signIn' && styles.tabTextActive,
              ]}
            >
              Sign In
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('signUp')}
            style={[
              styles.tab,
              activeTab === 'signUp' && styles.tabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'signUp' }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'signUp' && styles.tabTextActive,
              ]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        {/* Form area */}
        <View style={styles.formContainer}>
          {activeTab === 'signIn' ? (
            /* ---- Sign In Form ---- */
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={darkColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={darkColors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                />
              </View>

              {/* Error banner */}
              {error != null && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                title="Sign In"
                onPress={handleSignIn}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isSignInDisabled}
              />

              {resetSent && !error && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>
                    Password reset email sent. Check your inbox.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleForgotPassword}
                style={styles.forgotPasswordButton}
                accessibilityRole="button"
                disabled={isLoading || email.trim().length === 0}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </Pressable>
            </>
          ) : (
            /* ---- Sign Up Form ---- */
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={darkColors.textMuted}
                  autoCapitalize="words"
                  textContentType="name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={darkColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={darkColors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
              </View>

              {/* Error banner */}
              {error != null && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                title="Create Account"
                onPress={handleSignUp}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isSignUpDisabled}
              />
            </>
          )}
        </View>

        {/* Terms text */}
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy
          Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
  },
  closeButtonText: {
    fontSize: fontSizes.lg,
    color: darkColors.textSecondary,
    lineHeight: lineHeights.lg,
  },

  // Scroll content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginTop: spacing['4xl'],
    marginBottom: spacing['3xl'],
  },
  brandTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights['3xl'],
    color: darkColors.textPrimary,
  },
  brandTagline: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: darkColors.textSecondary,
    marginTop: spacing.xs,
  },

  // Tab selector
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: darkColors.primary,
  },
  tabText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.base,
    color: darkColors.textSecondary,
  },
  tabTextActive: {
    color: darkColors.primary,
    fontWeight: fontWeights.semibold,
  },

  // Form
  formContainer: {
    marginBottom: spacing['2xl'],
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: darkColors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 48,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    color: darkColors.textPrimary,
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: darkColors.danger,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: darkColors.danger,
  },

  // Success banner
  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: darkColors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  successText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: darkColors.success,
  },

  // Forgot password
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: darkColors.textSecondary,
  },

  // Terms
  termsText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginTop: 'auto' as unknown as number,
    paddingTop: spacing['2xl'],
  },
});

export default AuthScreen;
