// RuneKey/src/utils/theme.ts
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
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
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
  
  // Switch colors
  switchTrackOn: string;
  switchTrackOff: string;
  switchThumb: string;
  
  // Card colors
  cardBackground: string;
  cardBorder: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  backgroundCard: '#FFFFFF',
  backgroundCardHover: '#F8FAFC',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',
  
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  glass: 'rgba(255, 255, 255, 0.9)',
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(255, 255, 255, 0.5)',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowColor: '#000000',
  
  switchTrackOn: '#3B82F6',
  switchTrackOff: '#E2E8F0',
  switchThumb: '#FFFFFF',
  
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
};

const darkColors: ThemeColors = {
  background: '#000000',
  backgroundSecondary: '#0B1120',
  backgroundTertiary: '#1E293B',
  backgroundCard: 'rgba(30, 41, 59, 0.8)',
  backgroundCardHover: 'rgba(30, 41, 59, 0.95)',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  
  border: 'rgba(148, 163, 184, 0.2)',
  borderLight: 'rgba(148, 163, 184, 0.1)',
  borderDark: 'rgba(148, 163, 184, 0.3)',
  
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',
  
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  glass: 'rgba(30, 41, 59, 0.9)',
  glassLight: 'rgba(30, 41, 59, 0.7)',
  glassDark: 'rgba(30, 41, 59, 0.5)',
  
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowColor: '#000000',
  
  switchTrackOn: '#3B82F6',
  switchTrackOff: '#475569',
  switchThumb: '#FFFFFF',
  
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(148, 163, 184, 0.2)',
};

export const getThemeColors = (theme: ThemeMode, systemColorScheme: 'light' | 'dark' | null): ThemeColors => {
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  return isDark ? darkColors : lightColors;
};

export const useThemeColors = (): ThemeColors => {
  const theme = useAppStore((state) => state.theme);
  const systemColorScheme = useColorScheme();
  return getThemeColors(theme, systemColorScheme);
};

export const useIsDark = (): boolean => {
  const theme = useAppStore((state) => state.theme);
  const systemColorScheme = useColorScheme();
  return theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
};

