/**
 * Tuned Podcast Player - Typography System
 *
 * Font families:
 *   Headings : Plus Jakarta Sans  (geometric, modern feel)
 *   Body     : Inter              (excellent readability at small sizes)
 *   Mono     : JetBrains Mono     (timestamps, code snippets)
 *
 * All numeric values are in density-independent pixels (dp) for React Native.
 * White-label ready: every token can be overridden via createTheme().
 */

// ---------------------------------------------------------------------------
// Font Families
// ---------------------------------------------------------------------------

export const fontFamilies = {
  /** Used for headings (h1-h4), podcast titles, section headers. */
  heading: 'PlusJakartaSans',
  headingFallback: 'System',

  /** Used for body copy, descriptions, UI labels. */
  body: 'Inter',
  bodyFallback: 'System',

  /** Used for timestamps, episode codes, developer-facing text. */
  mono: 'JetBrainsMono',
  monoFallback: 'Courier',
} as const;

// ---------------------------------------------------------------------------
// Font Sizes  (base = 15 dp)
// ---------------------------------------------------------------------------

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// ---------------------------------------------------------------------------
// Font Weights (React Native uses string values)
// ---------------------------------------------------------------------------

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ---------------------------------------------------------------------------
// Line Heights  (paired 1-to-1 with font sizes for vertical rhythm)
// ---------------------------------------------------------------------------

export const lineHeights = {
  xs: 16, // 11 * ~1.45
  sm: 18, // 13 * ~1.38
  base: 22, // 15 * ~1.47
  lg: 24, // 17 * ~1.41
  xl: 28, // 20 * 1.40
  '2xl': 32, // 24 * ~1.33
  '3xl': 38, // 30 * ~1.27
  '4xl': 44, // 36 * ~1.22
} as const;

// ---------------------------------------------------------------------------
// Letter Spacing (subtle tracking adjustments)
// ---------------------------------------------------------------------------

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Pre-composed Text Styles
// ---------------------------------------------------------------------------

export const textStyles = {
  // Headings -----------------------------------------------------------------
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights['4xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },

  // Body ---------------------------------------------------------------------
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },

  // Captions / Labels --------------------------------------------------------
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },

  // Monospace ----------------------------------------------------------------
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  timestamp: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
} as const;

// ---------------------------------------------------------------------------
// Exported aggregate (consumed by ThemeProvider)
// ---------------------------------------------------------------------------

export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
} as const;

export type Typography = typeof typography;
