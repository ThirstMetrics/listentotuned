/**
 * Tuned Podcast Player - Settings Screen
 *
 * Full settings interface with grouped sections for Appearance, Playback,
 * Downloads, Notifications, and Data management. All preferences are
 * persisted via the settings store.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { darkColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
} from '../../theme/typography';
import { useAppNavigation } from '../../navigation/types';
import {
  useSettingsStore,
  ThemePreference,
  DownloadQuality,
  SkipForwardOption,
  SkipBackwardOption,
} from '../../stores/settingsStore';

// ---------------------------------------------------------------------------
// Cycle helpers
// ---------------------------------------------------------------------------

const THEME_CYCLE: ThemePreference[] = ['dark', 'light', 'system'];
const SKIP_FORWARD_CYCLE: SkipForwardOption[] = [15, 30, 60];
const SKIP_BACKWARD_CYCLE: SkipBackwardOption[] = [10, 15, 30];
const PLAYBACK_SPEED_CYCLE: number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const DOWNLOAD_QUALITY_CYCLE: DownloadQuality[] = ['low', 'medium', 'high'];

function cycleValue<T>(current: T, options: T[]): T {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// SettingsRow reusable component
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  isLast?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  onPress,
  children,
  isLast = false,
}) => {
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children ? (
        children
      ) : value !== undefined ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ---------------------------------------------------------------------------
// Section title component
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------

const SettingsScreen: React.FC = () => {
  const navigation = useAppNavigation();

  const theme = useSettingsStore((s) => s.theme);
  const skipForwardSeconds = useSettingsStore((s) => s.skipForwardSeconds);
  const skipBackwardSeconds = useSettingsStore((s) => s.skipBackwardSeconds);
  const defaultPlaybackSpeed = useSettingsStore((s) => s.defaultPlaybackSpeed);
  const streamOnCellular = useSettingsStore((s) => s.streamOnCellular);
  const autoDownload = useSettingsStore((s) => s.autoDownload);
  const downloadQuality = useSettingsStore((s) => s.downloadQuality);
  const notifications = useSettingsStore((s) => s.notifications);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setSkipForwardSeconds = useSettingsStore((s) => s.setSkipForwardSeconds);
  const setSkipBackwardSeconds = useSettingsStore((s) => s.setSkipBackwardSeconds);
  const setDefaultPlaybackSpeed = useSettingsStore((s) => s.setDefaultPlaybackSpeed);
  const setStreamOnCellular = useSettingsStore((s) => s.setStreamOnCellular);
  const setAutoDownload = useSettingsStore((s) => s.setAutoDownload);
  const setDownloadQuality = useSettingsStore((s) => s.setDownloadQuality);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  // -- Handlers --

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCycleTheme = useCallback(() => {
    setTheme(cycleValue(theme, THEME_CYCLE));
  }, [theme, setTheme]);

  const handleCycleSkipForward = useCallback(() => {
    setSkipForwardSeconds(cycleValue(skipForwardSeconds, SKIP_FORWARD_CYCLE));
  }, [skipForwardSeconds, setSkipForwardSeconds]);

  const handleCycleSkipBackward = useCallback(() => {
    setSkipBackwardSeconds(cycleValue(skipBackwardSeconds, SKIP_BACKWARD_CYCLE));
  }, [skipBackwardSeconds, setSkipBackwardSeconds]);

  const handleCyclePlaybackSpeed = useCallback(() => {
    setDefaultPlaybackSpeed(cycleValue(defaultPlaybackSpeed, PLAYBACK_SPEED_CYCLE));
  }, [defaultPlaybackSpeed, setDefaultPlaybackSpeed]);

  const handleCycleDownloadQuality = useCallback(() => {
    setDownloadQuality(cycleValue(downloadQuality, DOWNLOAD_QUALITY_CYCLE));
  }, [downloadQuality, setDownloadQuality]);

  const handleToggleStreamOnCellular = useCallback(
    (value: boolean) => {
      setStreamOnCellular(value);
    },
    [setStreamOnCellular],
  );

  const handleToggleAutoDownload = useCallback(
    (value: boolean) => {
      setAutoDownload(value);
    },
    [setAutoDownload],
  );

  const handleToggleNotifications = useCallback(
    (value: boolean) => {
      setNotifications(value);
    },
    [setNotifications],
  );

  const handleReset = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  // -- Formatted display values --

  const themeDisplay = capitalize(theme);
  const skipForwardDisplay = `${skipForwardSeconds}s`;
  const skipBackwardDisplay = `${skipBackwardSeconds}s`;
  const speedDisplay = `${defaultPlaybackSpeed}x`;
  const downloadQualityDisplay = capitalize(downloadQuality);

  // -- Render --

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backChevron}>{'\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        {/* Spacer to balance the back button for centering */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <Section title="APPEARANCE">
          <SettingsRow
            label="Theme"
            value={themeDisplay}
            onPress={handleCycleTheme}
            isLast
          />
        </Section>

        {/* Playback */}
        <Section title="PLAYBACK">
          <SettingsRow
            label="Skip Forward"
            value={skipForwardDisplay}
            onPress={handleCycleSkipForward}
          />
          <SettingsRow
            label="Skip Backward"
            value={skipBackwardDisplay}
            onPress={handleCycleSkipBackward}
          />
          <SettingsRow
            label="Default Speed"
            value={speedDisplay}
            onPress={handleCyclePlaybackSpeed}
            isLast
          />
        </Section>

        {/* Downloads */}
        <Section title="DOWNLOADS">
          <SettingsRow label="Stream on Cellular">
            <Switch
              value={streamOnCellular}
              onValueChange={handleToggleStreamOnCellular}
              trackColor={{
                false: darkColors.surfaceHover,
                true: darkColors.primary,
              }}
              thumbColor={darkColors.textPrimary}
            />
          </SettingsRow>
          <SettingsRow label="Auto Download">
            <Switch
              value={autoDownload}
              onValueChange={handleToggleAutoDownload}
              trackColor={{
                false: darkColors.surfaceHover,
                true: darkColors.primary,
              }}
              thumbColor={darkColors.textPrimary}
            />
          </SettingsRow>
          <SettingsRow
            label="Download Quality"
            value={downloadQualityDisplay}
            onPress={handleCycleDownloadQuality}
            isLast
          />
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <SettingsRow label="Push Notifications" isLast>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{
                false: darkColors.surfaceHover,
                true: darkColors.primary,
              }}
              thumbColor={darkColors.textPrimary}
            />
          </SettingsRow>
        </Section>

        {/* Data */}
        <Section title="DATA">
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset All Settings</Text>
          </TouchableOpacity>
        </Section>

        {/* Bottom safe spacing */}
        <View style={styles.bottomSpacer} />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.regular,
    color: darkColors.textPrimary,
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
  },
  headerSpacer: {
    width: spacing['4xl'],
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Section
  sectionContainer: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.semibold,
    color: darkColors.textMuted,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  rowLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textPrimary,
    flex: 1,
  },
  rowValue: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    marginLeft: spacing.sm,
  },

  // Reset button
  resetButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  resetButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    color: darkColors.danger,
  },

  // Bottom spacer
  bottomSpacer: {
    height: spacing['4xl'],
  },
});

export default SettingsScreen;
