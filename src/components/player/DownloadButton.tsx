/**
 * Tuned Podcast Player - DownloadButton Component
 *
 * Shows the download state of an episode:
 *   - none:        download arrow icon (tap to start)
 *   - downloading: circular progress indicator with percentage (tap to cancel)
 *   - downloaded:  filled checkmark circle (tap to remove)
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { darkColors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DownloadStatus = 'none' | 'downloading' | 'downloaded';

export interface DownloadButtonProps {
  status: DownloadStatus;
  /** 0-1 float representing download progress. Only used when status is 'downloading'. */
  progress?: number;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUTTON_SIZE = 32;
const RING_SIZE = 28;
const RING_STROKE = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DownloadButton: React.FC<DownloadButtonProps> = ({
  status,
  progress = 0,
  onPress,
}) => {
  const accessibilityLabel =
    status === 'none'
      ? 'Download episode'
      : status === 'downloading'
        ? `Downloading ${Math.round(progress * 100)}%, tap to cancel`
        : 'Downloaded, tap to remove';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {status === 'none' && <DownloadIcon />}
      {status === 'downloading' && <DownloadingIndicator progress={progress} />}
      {status === 'downloaded' && <DownloadedIcon />}
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Down-arrow icon for "not downloaded" state. */
const DownloadIcon: React.FC = () => (
  <Text style={styles.iconText}>{'\u2913'}</Text>
);

/** Checkmark in a filled circle for "downloaded" state. */
const DownloadedIcon: React.FC = () => (
  <View style={styles.downloadedCircle}>
    <Text style={styles.checkIcon}>{'\u2713'}</Text>
  </View>
);

/** Circular progress ring with percentage for "downloading" state. */
const DownloadingIndicator: React.FC<{ progress: number }> = ({ progress }) => {
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.downloadingContainer}>
      {/* Background ring */}
      <View style={styles.ring}>
        {/* We simulate a progress ring with a partially filled overlay. */}
        <View
          style={[
            styles.ringFill,
            {
              // Approximate visual: use opacity mapped to progress
              // For a true circular progress a SVG or canvas library is needed.
              // Here we fill a proportion of the ring's width.
              width: `${pct}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.pctText}>{pct}%</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  downloadedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  downloadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING_SIZE,
    height: RING_STROKE,
    backgroundColor: darkColors.surfaceHover,
    borderRadius: RING_STROKE / 2,
    overflow: 'hidden',
  },
  ringFill: {
    height: '100%',
    backgroundColor: darkColors.primary,
    borderRadius: RING_STROKE / 2,
  },
  pctText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: fontWeights.medium,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default DownloadButton;
