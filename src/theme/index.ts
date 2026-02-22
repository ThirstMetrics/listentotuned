/**
 * Tuned Podcast Player - Theme Provider & Public API
 *
 * Designed for white-label from day one:
 *   - Enterprise clients supply a partial ThemeOverrides config.
 *   - createTheme() deep-merges overrides onto the default tokens.
 *   - ThemeProvider injects the resolved theme via React Context.
 *   - useTheme() hook gives every component typed access to colors,
 *     typography, and spacing.
 *
 * Default color mode is DARK (optimised for media / audio apps).
 */

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

// -- Token modules -----------------------------------------------------------
import { darkColors, lightColors, brandColors, semanticColors } from './colors';
import type { ThemeColors } from './colors';
import { typography, fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing, textStyles } from './typography';
import type { Typography } from './typography';
import { spacingSystem, spacing, borderRadius, componentPadding, layout } from './spacing';
import type { SpacingSystem } from './spacing';

// Re-export everything so consumers can `import { darkColors } from '@/theme'`
export {
  darkColors,
  lightColors,
  brandColors,
  semanticColors,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
  spacingSystem,
  spacing,
  borderRadius,
  componentPadding,
  layout,
};

export type { ThemeColors, Typography, SpacingSystem };

// ---------------------------------------------------------------------------
// Theme Type
// ---------------------------------------------------------------------------

export type ColorMode = 'dark' | 'light';

export interface Theme {
  /** Display name shown in the app (white-label overridable). */
  brandName: string;

  /** Current color mode. */
  mode: ColorMode;

  /** Resolved color tokens for the active mode. */
  colors: ThemeColors;

  /** Typography tokens (font families, sizes, weights, text styles). */
  typography: Typography;

  /** Spacing, border-radius, component padding, and layout constants. */
  spacing: SpacingSystem;
}

// ---------------------------------------------------------------------------
// White-Label Overrides
// ---------------------------------------------------------------------------

/** Deep-partial helper (1 level of nesting is sufficient for our tokens). */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K];
};

export interface ThemeOverrides {
  brandName?: string;
  colors?: {
    dark?: Partial<ThemeColors>;
    light?: Partial<ThemeColors>;
  };
  typography?: DeepPartial<Typography>;
  spacing?: DeepPartial<SpacingSystem>;
}

// ---------------------------------------------------------------------------
// createTheme()  -  build a fully resolved Theme from optional overrides
// ---------------------------------------------------------------------------

function deepMerge<T extends Record<string, unknown>>(base: T, overrides?: Partial<T>): T {
  if (!overrides) return base;
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overVal = (overrides as Record<string, unknown>)[key];
    if (
      baseVal !== null &&
      overVal !== null &&
      typeof baseVal === 'object' &&
      typeof overVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overVal as Record<string, unknown>,
      );
    } else if (overVal !== undefined) {
      result[key] = overVal;
    }
  }
  return result as T;
}

export function createTheme(
  mode: ColorMode = 'dark',
  overrides?: ThemeOverrides,
): Theme {
  // Resolve colors for the requested mode, then apply per-mode overrides.
  const baseColors = mode === 'dark' ? darkColors : lightColors;
  const colorOverrides =
    mode === 'dark' ? overrides?.colors?.dark : overrides?.colors?.light;
  const resolvedColors = colorOverrides
    ? ({ ...baseColors, ...colorOverrides } as ThemeColors)
    : baseColors;

  // Merge typography overrides.
  const resolvedTypography = overrides?.typography
    ? deepMerge(typography as unknown as Record<string, unknown>, overrides.typography as Record<string, unknown>) as unknown as Typography
    : typography;

  // Merge spacing overrides.
  const resolvedSpacing = overrides?.spacing
    ? deepMerge(spacingSystem as unknown as Record<string, unknown>, overrides.spacing as Record<string, unknown>) as unknown as SpacingSystem
    : spacingSystem;

  return {
    brandName: overrides?.brandName ?? 'Tuned',
    mode,
    colors: resolvedColors,
    typography: resolvedTypography,
    spacing: resolvedSpacing,
  };
}

// ---------------------------------------------------------------------------
// React Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  theme: Theme;
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

export interface ThemeProviderProps {
  /** Starting color mode. Defaults to 'dark'. */
  initialMode?: ColorMode;
  /** White-label / enterprise overrides (merged into every generated theme). */
  overrides?: ThemeOverrides;
  children: React.ReactNode;
}

export function ThemeProvider({
  initialMode = 'dark',
  overrides,
  children,
}: ThemeProviderProps): React.ReactElement {
  const [colorMode, setColorMode] = useState<ColorMode>(initialMode);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const theme = useMemo(
    () => createTheme(colorMode, overrides),
    [colorMode, overrides],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colorMode, toggleColorMode, setColorMode }),
    [theme, colorMode, toggleColorMode],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// useTheme() Hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme inside any component tree wrapped by ThemeProvider.
 *
 * Returns:
 *   - theme.colors      - resolved color tokens for the active mode
 *   - theme.typography   - font families, sizes, weights, pre-composed styles
 *   - theme.spacing      - spacing scale, border radius, layout constants
 *   - theme.brandName    - app name (white-label overridable)
 *   - theme.mode         - current color mode ('dark' | 'light')
 *   - colorMode          - alias for theme.mode
 *   - toggleColorMode()  - switch between dark and light
 *   - setColorMode(mode) - set an explicit mode
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error(
      'useTheme() must be used within a <ThemeProvider>. ' +
        'Wrap your app root with <ThemeProvider> from "@/theme".',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Default theme instance (for use outside React tree, e.g. navigation theme)
// ---------------------------------------------------------------------------

export const defaultDarkTheme = createTheme('dark');
export const defaultLightTheme = createTheme('light');
