/**
 * Tuned Podcast Player - Now Playing Screen
 *
 * Full-screen modal player presented modally (slides up from the bottom).
 * This is the centrepiece of the app: large artwork, seekable progress bar,
 * transport controls, speed / repeat / sleep-timer / queue controls.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
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
import { usePlayerStore } from '../../stores/playerStore';

import PlayButton from '../../components/player/PlayButton';
import ProgressBar from '../../components/player/ProgressBar';
import EmptyState from '../../components/common/EmptyState';

import type { RepeatMode } from '../../types/player';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTWORK_SIZE = 280;

/** Available playback speed steps. */
const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

/** Sleep-timer presets in minutes. */
const SLEEP_PRESETS = [5, 10, 15, 30, 45, 60];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable speed label.
 * Whole numbers render as "1x", "2x"; fractional as "1.5x", "0.75x".
 */
function formatSpeed(speed: number): string {
  if (Number.isInteger(speed)) {
    return `${speed}x`;
  }
  return `${speed}x`;
}

/**
 * Returns the Unicode icon for the current repeat mode.
 */
function repeatIcon(mode: RepeatMode): string {
  switch (mode) {
    case 'off':
      return '\u{1F501}'; // repeat symbol (dimmed via color)
    case 'all':
      return '\u{1F501}'; // repeat symbol (highlighted)
    case 'one':
      return '\u{1F502}'; // repeat-one symbol
  }
}

/**
 * Returns a label string for the sleep timer button.
 */
function sleepTimerLabel(minutes: number | null): string {
  if (minutes === null) return '\u{23F2}'; // timer clock
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ControlButtonProps {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  fontSize?: number;
  color?: string;
}

const ControlButton: React.FC<ControlButtonProps> = React.memo(
  ({ label, accessibilityLabel, onPress, fontSize = 28, color = darkColors.textPrimary }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={[styles.controlButtonText, { fontSize, color }]}>{label}</Text>
    </Pressable>
  ),
);

// ---------------------------------------------------------------------------
// Speed Picker Overlay
// ---------------------------------------------------------------------------

interface SpeedPickerProps {
  currentSpeed: number;
  onSelect: (speed: number) => void;
  onClose: () => void;
}

const SpeedPicker: React.FC<SpeedPickerProps> = React.memo(
  ({ currentSpeed, onSelect, onClose }) => (
    <Pressable style={styles.overlayBackdrop} onPress={onClose}>
      <Pressable style={styles.speedPickerContainer} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.speedPickerTitle}>Playback Speed</Text>
        <View style={styles.speedGrid}>
          {SPEED_STEPS.map((speed) => {
            const isActive = speed === currentSpeed;
            return (
              <Pressable
                key={speed}
                onPress={() => onSelect(speed)}
                style={[
                  styles.speedChip,
                  isActive && styles.speedChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Set speed to ${formatSpeed(speed)}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.speedChipText,
                    isActive && styles.speedChipTextActive,
                  ]}
                >
                  {formatSpeed(speed)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  ),
);

// ---------------------------------------------------------------------------
// Sleep Timer Picker Overlay
// ---------------------------------------------------------------------------

interface SleepTimerPickerProps {
  activeMinutes: number | null;
  onSelect: (minutes: number | null) => void;
  onClose: () => void;
}

const SleepTimerPicker: React.FC<SleepTimerPickerProps> = React.memo(
  ({ activeMinutes, onSelect, onClose }) => (
    <Pressable style={styles.overlayBackdrop} onPress={onClose}>
      <Pressable style={styles.speedPickerContainer} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.speedPickerTitle}>Sleep Timer</Text>
        <View style={styles.speedGrid}>
          {SLEEP_PRESETS.map((minutes) => {
            const isActive = minutes === activeMinutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => onSelect(minutes)}
                style={[
                  styles.speedChip,
                  isActive && styles.speedChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Set sleep timer to ${minutes} minutes`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.speedChipText,
                    isActive && styles.speedChipTextActive,
                  ]}
                >
                  {minutes}m
                </Text>
              </Pressable>
            );
          })}
        </View>
        {activeMinutes !== null && (
          <Pressable
            onPress={() => onSelect(null)}
            style={styles.cancelTimerButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel sleep timer"
          >
            <Text style={styles.cancelTimerText}>Cancel Timer</Text>
          </Pressable>
        )}
      </Pressable>
    </Pressable>
  ),
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const NowPlayingScreen: React.FC = () => {
  const navigation = useAppNavigation();

  // -- Player store (single source of truth) ---------------------------------
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const playbackState = usePlayerStore((s) => s.playbackState);
  const progress = usePlayerStore((s) => s.progress);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const sleepTimer = usePlayerStore((s) => s.sleepTimer);

  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const skipForward = usePlayerStore((s) => s.skipForward);
  const skipBackward = usePlayerStore((s) => s.skipBackward);
  const setSpeed = usePlayerStore((s) => s.setSpeed);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const previousTrack = usePlayerStore((s) => s.previousTrack);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);

  const isPlaying = playbackState === 'playing';
  const isBuffering = playbackState === 'buffering' || playbackState === 'loading';
  const { position, duration, buffered } = progress;

  // -- Local UI state --------------------------------------------------------
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  // -- Handlers --------------------------------------------------------------

  const handleDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handleSeek = useCallback(
    (pos: number) => {
      seekTo(pos);
    },
    [seekTo],
  );

  const handleSkipForward = useCallback(() => {
    skipForward();
  }, [skipForward]);

  const handleSkipBackward = useCallback(() => {
    skipBackward();
  }, [skipBackward]);

  const handleNextTrack = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  const handlePreviousTrack = useCallback(() => {
    previousTrack();
  }, [previousTrack]);

  const handleSpeedSelect = useCallback(
    (speed: number) => {
      setSpeed(speed);
      setShowSpeedPicker(false);
    },
    [setSpeed],
  );

  const handleRepeatToggle = useCallback(() => {
    const cycleMap: Record<RepeatMode, RepeatMode> = {
      off: 'all',
      all: 'one',
      one: 'off',
    };
    const store = usePlayerStore.getState();
    const next = cycleMap[store.repeatMode];
    usePlayerStore.setState({ repeatMode: next });
  }, []);

  const handleSleepTimerSelect = useCallback(
    (minutes: number | null) => {
      setSleepTimer(minutes);
      setShowSleepPicker(false);
    },
    [setSleepTimer],
  );

  const handleOpenSpeedPicker = useCallback(() => {
    setShowSpeedPicker(true);
  }, []);

  const handleCloseSpeedPicker = useCallback(() => {
    setShowSpeedPicker(false);
  }, []);

  const handleOpenSleepPicker = useCallback(() => {
    setShowSleepPicker(true);
  }, []);

  const handleCloseSleepPicker = useCallback(() => {
    setShowSleepPicker(false);
  }, []);

  // -- Derived values --------------------------------------------------------

  const artworkUri = useMemo(() => {
    if (!currentTrack) return undefined;
    return currentTrack.episode.artworkUrl ?? currentTrack.podcastArtworkUrl ?? undefined;
  }, [currentTrack]);

  const repeatColor = useMemo(() => {
    switch (repeatMode) {
      case 'off':
        return darkColors.textMuted;
      case 'all':
      case 'one':
        return darkColors.primary;
    }
  }, [repeatMode]);

  const sleepTimerActive = sleepTimer.minutes !== null;

  // -- Empty state -----------------------------------------------------------

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.headerBar}>
          <View style={styles.pullIndicator} />
          <View style={styles.headerRow}>
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.headerButton, pressed && styles.controlButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss player"
            >
              <Text style={styles.headerButtonText}>{'\u25BE'}</Text>
            </Pressable>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <EmptyState
          icon="\u{1F3A7}"
          title="Nothing playing"
          subtitle="Search for a podcast to start listening"
        />
      </SafeAreaView>
    );
  }

  // -- Main render -----------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header bar                                                        */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.headerBar}>
          <View style={styles.pullIndicator} />
          <View style={styles.headerRow}>
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.headerButton, pressed && styles.controlButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss player"
            >
              <Text style={styles.headerButtonText}>{'\u25BE'}</Text>
            </Pressable>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.headerButton, pressed && styles.controlButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <Text style={styles.headerButtonText}>{'\u22EF'}</Text>
            </Pressable>
          </View>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Artwork                                                           */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.artworkContainer}>
          {artworkUri ? (
            <Image
              source={{ uri: artworkUri }}
              style={styles.artwork}
              resizeMode="cover"
              accessibilityLabel={`Artwork for ${currentTrack.episode.title}`}
            />
          ) : (
            <View style={[styles.artwork, styles.artworkPlaceholder]}>
              <Text style={styles.artworkPlaceholderIcon}>{'\u{1F3B5}'}</Text>
            </View>
          )}
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Track info                                                        */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.trackInfoContainer}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {currentTrack.episode.title}
          </Text>
          <Text style={styles.trackPodcast} numberOfLines={1}>
            {currentTrack.podcastTitle}
          </Text>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Progress bar                                                      */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.progressContainer}>
          <ProgressBar
            position={position}
            duration={duration}
            buffered={buffered}
            onSeek={handleSeek}
            showTime
          />
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Main controls row                                                 */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.mainControlsRow}>
          <ControlButton
            label={'\u23EE'}
            accessibilityLabel="Previous track"
            onPress={handlePreviousTrack}
            fontSize={24}
            color={darkColors.textSecondary}
          />
          <ControlButton
            label={'-15'}
            accessibilityLabel="Skip backward 15 seconds"
            onPress={handleSkipBackward}
            fontSize={16}
            color={darkColors.textPrimary}
          />
          <PlayButton
            isPlaying={isPlaying || isBuffering}
            onPress={handlePlayPause}
            size="lg"
            variant="primary"
          />
          <ControlButton
            label={'+30'}
            accessibilityLabel="Skip forward 30 seconds"
            onPress={handleSkipForward}
            fontSize={16}
            color={darkColors.textPrimary}
          />
          <ControlButton
            label={'\u23ED'}
            accessibilityLabel="Next track"
            onPress={handleNextTrack}
            fontSize={24}
            color={darkColors.textSecondary}
          />
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Secondary controls row                                            */}
        {/* ----------------------------------------------------------------- */}
        <View style={styles.secondaryControlsRow}>
          {/* Speed button */}
          <Pressable
            onPress={handleOpenSpeedPicker}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.controlButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Playback speed ${formatSpeed(playbackSpeed)}`}
          >
            <Text style={styles.secondaryButtonText}>
              {formatSpeed(playbackSpeed)}
            </Text>
          </Pressable>

          {/* Repeat mode */}
          <Pressable
            onPress={handleRepeatToggle}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.controlButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Repeat mode: ${repeatMode}`}
          >
            <Text style={[styles.secondaryButtonIcon, { color: repeatColor }]}>
              {repeatIcon(repeatMode)}
            </Text>
          </Pressable>

          {/* Sleep timer */}
          <Pressable
            onPress={handleOpenSleepPicker}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.controlButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              sleepTimerActive
                ? `Sleep timer: ${sleepTimer.minutes} minutes`
                : 'Set sleep timer'
            }
          >
            <Text
              style={[
                styles.secondaryButtonText,
                sleepTimerActive && styles.secondaryButtonActive,
              ]}
            >
              {sleepTimerLabel(sleepTimer.minutes)}
            </Text>
          </Pressable>

          {/* Queue */}
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.controlButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Queue: ${queue.length} items`}
          >
            <Text style={styles.secondaryButtonText}>
              {'\u2630'}
              {queue.length > 0 ? ` ${queue.length}` : ''}
            </Text>
          </Pressable>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ------------------------------------------------------------------- */}
      {/* Overlay pickers                                                     */}
      {/* ------------------------------------------------------------------- */}
      {showSpeedPicker && (
        <SpeedPicker
          currentSpeed={playbackSpeed}
          onSelect={handleSpeedSelect}
          onClose={handleCloseSpeedPicker}
        />
      )}
      {showSleepPicker && (
        <SleepTimerPicker
          activeMinutes={sleepTimer.minutes}
          onSelect={handleSleepTimerSelect}
          onClose={handleCloseSleepPicker}
        />
      )}
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // -- Layout ----------------------------------------------------------------
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
  },

  // -- Header ----------------------------------------------------------------
  headerBar: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pullIndicator: {
    width: 36,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surfaceHover,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerButton: {
    width: spacing['4xl'],
    height: spacing['4xl'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: fontSizes['2xl'],
    color: darkColors.textPrimary,
  },
  headerSpacer: {
    width: spacing['4xl'],
  },

  // -- Artwork ---------------------------------------------------------------
  artworkContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.xl,
    backgroundColor: darkColors.surface,
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderIcon: {
    fontSize: 64,
  },

  // -- Track info ------------------------------------------------------------
  trackInfoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.sm,
  },
  trackTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trackPodcast: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },

  // -- Progress --------------------------------------------------------------
  progressContainer: {
    marginBottom: spacing['2xl'],
  },

  // -- Main controls ---------------------------------------------------------
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['3xl'],
  },

  // -- Control button (reusable) ---------------------------------------------
  controlButton: {
    width: spacing['5xl'],
    height: spacing['5xl'],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  controlButtonPressed: {
    opacity: 0.6,
  },

  // -- Secondary controls ----------------------------------------------------
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: spacing['5xl'],
  },
  secondaryButtonText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.textSecondary,
  },
  secondaryButtonIcon: {
    fontSize: fontSizes.xl,
  },
  secondaryButtonActive: {
    color: darkColors.primary,
  },

  // -- Bottom spacer ---------------------------------------------------------
  bottomSpacer: {
    height: spacing['3xl'],
  },

  // -- Overlay pickers -------------------------------------------------------
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkColors.overlay,
    justifyContent: 'flex-end',
  },
  speedPickerContainer: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  speedPickerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  speedChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.background,
    minWidth: 64,
    alignItems: 'center',
  },
  speedChipActive: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.primary,
  },
  speedChipText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    color: darkColors.textSecondary,
  },
  speedChipTextActive: {
    color: darkColors.textPrimary,
  },
  cancelTimerButton: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  cancelTimerText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    color: darkColors.danger,
  },
});

export default NowPlayingScreen;
