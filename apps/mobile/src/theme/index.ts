import type { TextStyle, ViewStyle } from 'react-native';
import { colors as figmaColors } from '../../theme/colors';
import { typography as figmaTypography } from '../../theme/typography';
import { spacing as figmaSpacing } from '../../theme/spacing';
import { radii as figmaRadii } from '../../theme/radii';
import { shadows as figmaShadows } from '../../theme/shadows';

type ColorTokens = Record<string, string>;
type TypographyTokens = Record<
  string,
  {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    lineHeight?: number | string;
    letterSpacing?: number;
  }
>;
type RadiusTokens = Record<string, number>;
type ShadowTokens = Record<
  string,
  {
    offsetX?: number;
    offsetY?: number;
    radius?: number;
    color?: string;
  }
>;

type AllowedFontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 'normal'
  | 'bold';

const colorTokens = figmaColors as ColorTokens;
const typographyTokens = figmaTypography as TypographyTokens;
const radiusTokens = figmaRadii as RadiusTokens;
const shadowTokens = figmaShadows as ShadowTokens;

const parseLineHeight = (value?: number | string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toFontWeight = (weight?: number | string): AllowedFontWeight | undefined => {
  if (weight === undefined) return undefined;
  if (typeof weight === 'number') {
    const numeric = weight.toString();
    if (
      numeric === '100' ||
      numeric === '200' ||
      numeric === '300' ||
      numeric === '400' ||
      numeric === '500' ||
      numeric === '600' ||
      numeric === '700' ||
      numeric === '800' ||
      numeric === '900'
    ) {
      return numeric;
    }
    return undefined;
  }
  if (weight === 'normal' || weight === 'bold') {
    return weight;
  }
  if (/^(100|200|300|400|500|600|700|800|900)$/.test(weight)) {
    return weight as AllowedFontWeight;
  }
  return undefined;
};

const pickColor = (name: string, fallback: string) =>
  colorTokens[name] ?? fallback;

const pickRadius = (name: string, fallback: number) =>
  radiusTokens[name] ?? fallback;

const pickTextStyle = (name: string, fallback: TextStyle): TextStyle => {
  const token = typographyTokens[name];
  if (!token) return fallback;

  return {
    ...fallback,
    fontSize: token.fontSize ?? fallback.fontSize,
    fontFamily: token.fontFamily ?? fallback.fontFamily,
    fontWeight: toFontWeight(token.fontWeight) ?? fallback.fontWeight,
    lineHeight: parseLineHeight(token.lineHeight) ?? fallback.lineHeight,
    letterSpacing: token.letterSpacing ?? fallback.letterSpacing,
  };
};

const parseRgba = (value?: string) => {
  if (!value) {
    return { color: 'rgb(0,0,0)', opacity: 0.25 };
  }

  const match =
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/.exec(
      value
    );

  if (!match) {
    return { color: value, opacity: 0.25 };
  }

  const [, r, g, b, alpha] = match;

  return {
    color: `rgb(${r}, ${g}, ${b})`,
    opacity: alpha ? parseFloat(alpha) : 1,
  };
};

const pickShadow = (name: string, fallback: ViewStyle): ViewStyle => {
  const token = shadowTokens[name];
  if (!token) return fallback;

  const { color, opacity } = parseRgba(token.color);
  const baseOffset = fallback.shadowOffset ?? { width: 0, height: 0 };
  const radius = token.radius ?? fallback.shadowRadius ?? 0;

  return {
    ...fallback,
    shadowColor: color ?? fallback.shadowColor,
    shadowOpacity: opacity ?? fallback.shadowOpacity,
    shadowOffset: {
      width: token.offsetX ?? baseOffset.width,
      height: token.offsetY ?? baseOffset.height,
    },
    shadowRadius: radius,
    elevation: Math.max(1, token.radius ? Math.round(token.radius) : fallback.elevation ?? 1),
  };
};

const defaultSpacing = {
  screen: 24,
  section: 20,
  cardGap: 16,
  cardPadding: 20,
  small: 8,
};

export const palette = {
  background: pickColor('dashboard-home', '#ffffff'),
  surface: pickColor('rectangle-18', '#faead1'),
  primary: pickColor('rectangle-7', '#f29303'),
  accent: pickColor('rectangle-19', '#f29303'),
  textPrimary: pickColor('welcome-back-name', '#7a6a52'),
  textSecondary: pickColor('search-for-recipes', '#cdc3b4'),
  textOnPrimary: pickColor('vector', '#ffffff'),
  border: pickColor('rectangle-26', '#e0d7c8'),
};

export const textVariants: Record<'headline' | 'sectionTitle' | 'body' | 'caption', TextStyle> = {
  headline: pickTextStyle('welcome-back-name', {
    fontSize: 28,
    fontFamily: 'Poppins',
    fontWeight: '700',
    lineHeight: 34,
  }),
  sectionTitle: pickTextStyle('your-recipes', {
    fontSize: 22,
    fontFamily: 'Poppins',
    fontWeight: '700',
    lineHeight: 28,
  }),
  body: pickTextStyle('milk-eggs-cheese-chicken', {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 22,
  }),
  caption: pickTextStyle('mon', {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 16,
  }),
};

export const radius = {
  card: pickRadius('rectangle-18', 16),
  button: pickRadius('login-btn', 24),
  chip: pickRadius('rectangle-26', 8),
};

export const shadowPresets: Record<'card', ViewStyle> = {
  card: pickShadow('rectangle-18-0', {
    shadowColor: 'rgb(0,0,0)',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  }),
};

export const layoutSpacing = {
  ...defaultSpacing,
  raw: figmaSpacing,
};

export const figmaTokens = {
  colors: figmaColors,
  typography: figmaTypography,
  spacing: figmaSpacing,
  radii: figmaRadii,
  shadows: figmaShadows,
};
