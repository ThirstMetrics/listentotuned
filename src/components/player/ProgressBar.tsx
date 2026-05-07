/**
 * Tuned Podcast Player - ProgressBar Component
 *
 * Seekable audio progress bar with buffered indicator and optional time
 * labels. The user can tap or drag to seek.
 *
 * Track colors:
 *   - Background track: slate 700 (#334155)
 *   - Buffered fill:    slate 600 (#475569)
 *   - Progress fill:    indigo    (#4F46E5)
 *   - Thumb:            white circle (visible on touch)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { darkColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { fontFamilies, fontSizes, lineHeights, fontWeights } from '../../theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressBarProps {
  /** Current playback position in seconds. */
  position: number;
  /** Total duration in seconds. */
  duration: number;
  /** Buffered amount in seconds. */
  buffered?: number;
  /** Called when the user seeks to a new position (seconds). */
  onSeek?: (position: number) => void;
  /** Show current / total time labels below the bar. Defaults to true. */
  showTime?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRACK_HEIGHT = 4;
const TRACK_HEIGHT_ACTIVE = 6;
const THUMB_SIZE = 16;

/** Formats seconds into mm:ss or h:mm:ss. */
function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    const mm = m.toString().padStart(2, '0');
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProgressBar: React.FC<ProgressBarProps> = ({
  position,
  duration,
  buffered = 0,
  onSeek,
  showTime = true,
}) => {
  const trackWidth = useRef(0);
  const [isTouching, setIsTouching] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const progress = duration > 0 ? clamp(position / duration, 0, 1) : 0;
  const bufferedProgress = duration > 0 ? clamp(buffered / duration, 0, 1) : 0;
  const displayProgress = isTouching && duration > 0 ? clamp(seekPosition / duration, 0, 1) : progress;

  const positionFromPageX = useCallback(
    (pageX: number, layoutX: number): number => {
      if (trackWidth.current <= 0 || duration <= 0) return 0;
      const relativeX = pageX - layoutX;
      const ratio = clamp(relativeX / trackWidth.current, 0, 1);
      return ratio * duration;
    },
    [duration],
  );

  const layoutXRef = useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      setIsTouching(true);
      const pageX = e.nativeEvent.pageX;
      const locationX = e.nativeEvent.locationX;
      layoutXRef.current = pageX - locationX;
      const pos = positionFromPageX(pageX, layoutXRef.current);
      setSeekPosition(pos);
    },
    [positionFromPageX],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const pageX = e.nativeEvent.pageX;
      const pos = positionFromPageX(pageX, layoutXRef.current);
      setSeekPosition(pos);
    },
    [positionFromPageX],
  );

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    if (onSeek) {
      onSeek(seekPosition);
    }
  }, [onSeek, seekPosition]);

  const currentTrackHeight = isTouching ? TRACK_HEIGHT_ACTIVE : TRACK_HEIGHT;

  return (
    <View style={styles.wrapper}>
      {/* Track */}
      <View
        style={[styles.trackContainer, { height: THUMB_SIZE }]}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
        accessibilityRole="adjustable"
        accessibilityLabel={`Playback progress: ${formatTime(position)} of ${formatTime(duration)}`}
      >
        {/* Background track */}
        <View style={[styles.track, { height: currentTrackHeight }]}>
          {/* Buffered fill */}
          <View
            style={[
              styles.bufferedFill,
              {
                width: `${bufferedProgress * 100}%`,
                height: currentTrackHeight,
              },
            ]}
          />
          {/* Progress fill */}
          <View
            style={[
              styles.progressFill,
              {
                width: `${displayProgress * 100}%`,
                height: currentTrackHeight,
              },
            ]}
          />
        </View>

        {/* Thumb */}
        {isTouching && (
          <View
            style={[
              styles.thumb,
              {
                left: `${displayProgress * 100}%`,
                marginLeft: -(THUMB_SIZE / 2),
              },
            ]}
          />
        )}
      </View>

      {/* Time labels */}
      {showTime && (
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(isTouching ? seekPosition : position)}
          </Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  trackContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    backgroundColor: '#334155',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  bufferedFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#475569',
    borderRadius: borderRadius.full,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.full,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    top: 0,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    color: darkColors.textSecondary,
  },
});

export default ProgressBar;
