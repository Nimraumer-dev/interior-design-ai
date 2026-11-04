/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // ── existing tokens (unchanged) ──────────────────────────────────
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // ── brand: warm luxury palette ───────────────────────────────────
    ivory: '#F8F5EF',
    cream: '#F1EBE1',
    beige: '#E7DED2',
    walnut: '#403329',
    taupe: '#8D8175',
    gold: '#B69A70',
    espresso: '#30251F',
    surface: '#F8F5EF',
    surfaceElevated: '#FFFFFF',
    border: '#E7DED2',
    accent: '#B69A70',
    accentMuted: '#D4BC9A',
    textOnAccent: '#FFFFFF',
    textMuted: '#8D8175',
    overlay: 'rgba(48, 37, 31, 0.45)',
  },
  dark: {
    // ── existing tokens (unchanged) ──────────────────────────────────
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    // ── brand: warm luxury palette (dark variants) ───────────────────
    ivory: '#1C1814',
    cream: '#231E19',
    beige: '#2A2420',
    walnut: '#D4BC9A',
    taupe: '#A89E94',
    gold: '#C4A97A',
    espresso: '#EDE0D0',
    surface: '#1C1814',
    surfaceElevated: '#231E19',
    border: '#3A3028',
    accent: '#C4A97A',
    accentMuted: '#8D7055',
    textOnAccent: '#1C1814',
    textMuted: '#A89E94',
    overlay: 'rgba(0, 0, 0, 0.60)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Raw brand palette — use these for one-off values outside the theme system */
export const Brand = {
  ivory: '#F8F5EF',
  cream: '#F1EBE1',
  white: '#FFFFFF',
  walnut: '#403329',
  taupe: '#8D8175',
  gold: '#B69A70',
  beige: '#E7DED2',
  espresso: '#30251F',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Typography scale for the luxury brand */
export const Typography = {
  /** Display hero — serif, large editorial headings */
  displayLarge: { fontSize: 40, lineHeight: 48, fontWeight: '600' as const },
  displayMedium: { fontSize: 32, lineHeight: 40, fontWeight: '600' as const },
  /** Section headings */
  headingLarge: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  headingMedium: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  headingSmall: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  /** Body copy */
  bodyLarge: { fontSize: 16, lineHeight: 26, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const },
  /** Labels and captions */
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSmall: { fontSize: 10, lineHeight: 14, fontWeight: '500' as const },
  /** Uppercase tracking label — used for section tags, badges */
  overline: { fontSize: 10, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 1.5 },
} as const;

/** Elevation / shadow presets */
export const Shadow = {
  soft: {
    shadowColor: '#403329',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#403329',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  strong: {
    shadowColor: '#403329',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

/** Border radius scale */
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
