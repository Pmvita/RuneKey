import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../../types';
import { STORAGE_KEYS, DEFAULT_FEATURE_FLAGS, APP_CONFIG } from '../../constants';

interface AppActions {
  // Theme management
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Currency management
  setCurrency: (currency: 'USD' | 'EUR' | 'GBP') => void;
  
  // Feature flags
  updateFeatureFlag: (flag: keyof AppState['featureFlags'], value: boolean) => void;
  setFeatureFlags: (flags: Partial<AppState['featureFlags']>) => void;
  
  // App lifecycle
  setFirstLaunch: (isFirst: boolean) => void;
  setPriceRefreshInterval: (interval: number) => void;
  
  // Developer mode
  setDeveloperMode: (enabled: boolean) => void;
  
  // Utilities
  reset: () => void;
}

const initialState: AppState = {
  theme: 'system',
  currency: 'USD',
  isFirstLaunch: true,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  priceRefreshInterval: APP_CONFIG.PRICE_REFRESH_INTERVAL,
  developerMode: false,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => {
        set({ theme });
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      updateFeatureFlag: (flag, value) => {
        set((state) => ({
          featureFlags: {
            ...state.featureFlags,
            [flag]: value,
          },
        }));
      },

      setFeatureFlags: (flags) => {
        set((state) => ({
          featureFlags: {
            ...state.featureFlags,
            ...flags,
          },
        }));
      },

      setFirstLaunch: (isFirst) => {
        set({ isFirstLaunch: isFirst });
      },

      setPriceRefreshInterval: (interval) => {
        set({ priceRefreshInterval: interval });
      },

      setDeveloperMode: (enabled) => {
        set({ developerMode: enabled });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors for common state combinations
export const useTheme = () => useAppStore((state) => state.theme);
export const useCurrency = () => useAppStore((state) => state.currency);
export const useFeatureFlags = () => useAppStore((state) => state.featureFlags);
export const useIsFirstLaunch = () => useAppStore((state) => state.isFirstLaunch);