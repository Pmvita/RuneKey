// RuneKey Design System v2.0 - Top-tier Crypto Wallet UI/UX
// Inspired by Phantom Wallet + Trust Wallet redesign
// Dark mode first, glass morphism, smooth animations, premium feel

import { useColorScheme } from 'react-native';
import { useAppStore } from '../stores/app/useAppStore';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundCard: string;
  backgroundCardHover: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Primary colors (RuneKey brand - Indigo/Violet)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors (Amber/Gold for premium feel)
  accent: string;
  accentLight: string;
  accentDark: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // Glass morphism
  glass: string;
  glassLight: string;
  glassDark: string;
  
  // Shadows
  shadow: string;
  shadowLight: string;
  shadowColor: string;
  elevation: {
    none: number;
    down: number;
    up: number;
    raised: number;
  };
  
  // Switch colors
  switchTrackOn: string;
  switchTrackOff: string;
  switchThumb: string;
  
  // Card colors
  cardBackground: string;
  cardBorder: string;
  
  // RuneKey brand colors
  runekeyPrimary: string;
  runekeySecondary: string;
  runekeyAccent: string;
  
  // Gradient
  gradient: [string, string, string];
  gradientDark: [string, string, string];
  
  // Logo colors
  logoPrimary: string;
  logoSecondary: string;
}

// RuneKey brand colors - premium Indigo to Amber gradient
const runekeyBrand: {
  primary: string;
  secondary: string;
  accent: string;
  gradient: [string, string, string];
  gradientDark: [string, string, string];
} = {
  primary: '#6366F1',      // Indigo-500
  secondary: '#8B5CF6',    // Violet-500
  accent: '#F59E0B',       // Amber-500
  gradient: ['#6366F1', '#8B5CF6', '#F59E0B'], // Indigo -> Violet -> Amber
  gradientDark: ['#818CF8', '#A5B4FC', '#FCD34D'], // Lighter for dark mode
};

const lightColors: ThemeColors = {
  // Background colors
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F1F5F9',
  backgroundCard: '#FFFFFF',
  backgroundCardHover: '#F8FAFC',
  
  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  
  // Primary colors
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Accent colors
  accent: '#F59E0B',
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  
  // Status colors
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.7)',
  glassLight: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(255, 255, 255, 0.3)',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowColor: '#000000',
  elevation: {
    none: 0,
    down: 4,
    up: 8,
    raised: 12,
  },
  
  // Switch colors
  switchTrackOn: '#6366F1',
  switchTrackOff: '#E2E8F0',
  switchThumb: '#FFFFFF',
  
  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  
  // RuneKey brand
  runekeyPrimary: '#6366F1',
  runekeySecondary: '#8B5CF6',
  runekeyAccent: '#F59E0B',
  
  // Gradient
  gradient: ['#6366F1', '#8B5CF6', '#F59E0B'],
  gradientDark: ['#818CF8', '#A5B4FC', '#FCD34D'],
  
  // Logo colors
  logoPrimary: '#6366F1',
  logoSecondary: '#8B5CF6',
};

const darkColors: ThemeColors = {
  // Background colors
  background: '#0B1120',
  backgroundSecondary: '#0F172A',
  backgroundTertiary: '#1E293B',
  backgroundCard: 'rgba(30, 41, 59, 0.8)',
  backgroundCardHover: 'rgba(30, 41, 59, 0.95)',
  
  // Text colors
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  
  // Border colors
  border: 'rgba(148, 163, 184, 0.2)',
  borderLight: 'rgba(148, 163, 184, 0.1)',
  borderDark: 'rgba(148, 163, 184, 0.3)',
  
  // Primary colors
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  
  // Accent colors
  accent: '#FBBF24',
  accentLight: '#FCD34D',
  accentDark: '#F59E0B',
  
  // Status colors
  success: '#4ADE80',
  successLight: '#22C55E',
  warning: '#FBBF24',
  warningLight: '#F59E0B',
  error: '#F87171',
  errorLight: '#EF4444',
  info: '#60A5FA',
  infoLight: '#3B82F6',
  
  // Glass morphism
  glass: 'rgba(30, 41, 59, 0.9)',
  glassLight: 'rgba(30, 41, 59, 0.7)',
  glassDark: 'rgba(30, 41, 59, 0.5)',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowColor: '#000000',
  elevation: {
    none: 0,
    down: 4,
    up: 8,
    raised: 12,
  },
  
  // Switch colors
  switchTrackOn: '#818CF8',
  switchTrackOff: '#334155',
  switchThumb: '#E2E8F0',
  
  // Card colors
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(148, 163, 184, 0.2)',
  
  // RuneKey brand
  runekeyPrimary: '#818CF8',
  runekeySecondary: '#A5B4FC',
  runekeyAccent: '#FCD34D',
  
  // Gradient
  gradient: ['#818CF8', '#A5B4FC', '#FCD34D'],
  gradientDark: ['#6366F1', '#8B5CF6', '#F59E0B'],
  
  // Logo colors
  logoPrimary: '#818CF8',
  logoSecondary: '#A5B4FC',
};

export const getThemeColors = (theme: ThemeMode, systemColorScheme: 'light' | 'dark' | null): ThemeColors => {
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  return isDark ? darkColors : lightColors;
};

export const useThemeColors = (): ThemeColors => {
  const theme = useAppStore((state) => state.theme);
  const systemColorScheme = useColorScheme() as 'light' | 'dark' | null;
  return getThemeColors(theme, systemColorScheme);
};

export const useIsDark = (): boolean => {
  const theme = useAppStore((state) => state.theme);
  const systemColorScheme = useColorScheme();
  return theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
};

