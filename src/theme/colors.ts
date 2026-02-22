/**
 * Tuned Podcast Player - Color System
 *
 * Brand colors following the design spec:
 *   Primary:   Deep Indigo -> Electric Violet gradient
 *   Secondary: Warm Amber
 *   Default mode: Dark (optimized for media consumption)
 *
 * White-label ready: enterprise clients can override any color token.
 */

// ---------------------------------------------------------------------------
// Brand Colors (shared across themes)
// ---------------------------------------------------------------------------

export const brandColors = {
  // Primary - Deep Indigo family
  primary: '#4F46E5', // Indigo 600
  primaryHover: '#4338CA', // Indigo 700
  primaryLight: '#EEF2FF', // Indigo 50

  // Violet accent - used for AI-powered features
  violet: '#7C3AED', // Violet 600

  // Secondary - Warm Amber family
  secondary: '#F59E0B', // Amber 500
  secondaryHover: '#D97706', // Amber 600
  secondaryLight: '#FFFBEB', // Amber 50

  // Gradient endpoints (for LinearGradient components)
  gradientStart: '#4F46E5', // Indigo 600
  gradientEnd: '#7C3AED', // Violet 600
} as const;

// ---------------------------------------------------------------------------
// Semantic / Functional Colors (shared across themes)
// ---------------------------------------------------------------------------

export const semanticColors = {
  success: '#22C55E', // Green 500
  warning: '#F59E0B', // Amber 500
  danger: '#EF4444', // Red 500
  info: '#3B82F6', // Blue 500

  /** Accent used for AI-powered features (transcription, summaries, etc.) */
  ai: '#7C3AED', // Violet 600

  /** Accent used for premium / subscription badges */
  premium: '#F59E0B', // Amber 500
} as const;

// ---------------------------------------------------------------------------
// Dark Mode Colors (DEFAULT for a media app)
// ---------------------------------------------------------------------------

export const darkColors = {
  ...brandColors,
  ...semanticColors,

  // Surfaces
  background: '#0F172A', // Slate 900
  surface: '#1E293B', // Slate 800
  surfaceHover: '#334155', // Slate 700

  // Typography
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500

  // Borders & Dividers
  border: '#334155', // Slate 700

  // Overlay / Scrim
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Player-specific
  playerBackground: '#0F172A',
  waveformActive: '#4F46E5',
  waveformInactive: '#334155',
} as const;

// ---------------------------------------------------------------------------
// Light Mode Colors
// ---------------------------------------------------------------------------

export const lightColors = {
  ...brandColors,
  ...semanticColors,

  // Surfaces
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9', // Slate 100

  // Typography
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400

  // Borders & Dividers
  border: '#E2E8F0', // Slate 200

  // Overlay / Scrim
  overlay: 'rgba(15, 23, 42, 0.4)',

  // Player-specific
  playerBackground: '#FFFFFF',
  waveformActive: '#4F46E5',
  waveformInactive: '#E2E8F0',
} as const;

// ---------------------------------------------------------------------------
// Derived Types
// ---------------------------------------------------------------------------

/** Union of every color token available in a resolved theme. */
export type ThemeColors = typeof darkColors;
