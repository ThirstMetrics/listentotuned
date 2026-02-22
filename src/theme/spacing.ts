/**
 * Tuned Podcast Player - Spacing & Layout System
 *
 * Base unit: 4 dp (density-independent pixels).
 * Every spacing token is a multiple of the base unit to guarantee a
 * consistent 4-point grid across the entire application.
 *
 * White-label ready: all tokens can be overridden via createTheme().
 */

// ---------------------------------------------------------------------------
// Base Unit
// ---------------------------------------------------------------------------

export const BASE_UNIT = 4;

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------

export const spacing = {
  /** 4 dp  - hairline gaps, icon padding */
  xs: 4,
  /** 8 dp  - tight element spacing */
  sm: 8,
  /** 12 dp - default inline spacing */
  md: 12,
  /** 16 dp - standard component spacing */
  lg: 16,
  /** 20 dp - comfortable spacing */
  xl: 20,
  /** 24 dp - section inner padding */
  '2xl': 24,
  /** 32 dp - between grouped sections */
  '3xl': 32,
  /** 40 dp - large section breaks */
  '4xl': 40,
  /** 48 dp - screen-level vertical rhythm */
  '5xl': 48,
  /** 64 dp - hero / splash spacing */
  '6xl': 64,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  /** 4 dp  - subtle rounding (buttons, inputs) */
  sm: 4,
  /** 8 dp  - cards, list items */
  md: 8,
  /** 12 dp - modals, sheets */
  lg: 12,
  /** 16 dp - large cards, featured artwork */
  xl: 16,
  /** 9999 dp - pill shapes, avatar circles */
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Component-Level Padding Constants
// ---------------------------------------------------------------------------

export const componentPadding = {
  /** Inner padding for cards (episode cards, podcast cards) */
  cardPadding: 16,
  /** Padding inside section containers (e.g., "Trending", "Recently Played") */
  sectionPadding: 20,
  /** Horizontal safe-area padding for screens */
  screenPadding: 16,
} as const;

// ---------------------------------------------------------------------------
// Layout Helpers
// ---------------------------------------------------------------------------

export const layout = {
  /** Standard mini-player height at bottom of screen */
  miniPlayerHeight: 64,
  /** Full-screen player top safe-area offset */
  playerTopOffset: 48,
  /** Tab bar height */
  tabBarHeight: 56,
  /** Standard touchable minimum height (accessibility) */
  touchableMinHeight: 44,
  /** Standard icon size */
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
} as const;

// ---------------------------------------------------------------------------
// Exported aggregate (consumed by ThemeProvider)
// ---------------------------------------------------------------------------

export const spacingSystem = {
  spacing,
  borderRadius,
  componentPadding,
  layout,
} as const;

export type SpacingSystem = typeof spacingSystem;
