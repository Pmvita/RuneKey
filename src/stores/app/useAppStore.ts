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
  
  // Authentication
  logout: () => void;
  
  // Utilities
  reset: () => void;
}

const initialState: AppState = {
  theme: 'system',
  currency: 'USD',
  isFirstLaunch: false,
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

      logout: () => {
        // Reset app state to show login/onboarding
        set({ isFirstLaunch: true });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
      // Migrate stored values to ensure proper types
      migrate: (persistedState: any, version: number) => {
        // Ensure boolean values are actually booleans, not strings
        if (!persistedState || typeof persistedState !== 'object') {
          return initialState;
        }
        
        const migratedState = { ...persistedState };
        
        // Fix isFirstLaunch - handle all possible string representations
        if (migratedState.isFirstLaunch !== undefined && migratedState.isFirstLaunch !== null) {
          if (typeof migratedState.isFirstLaunch === 'string') {
            migratedState.isFirstLaunch = migratedState.isFirstLaunch.toLowerCase() === 'true' || migratedState.isFirstLaunch === '1';
          } else {
            migratedState.isFirstLaunch = Boolean(migratedState.isFirstLaunch);
          }
        } else {
          migratedState.isFirstLaunch = initialState.isFirstLaunch;
        }
        
        // Fix developerMode - handle all possible string representations
        if (migratedState.developerMode !== undefined && migratedState.developerMode !== null) {
          if (typeof migratedState.developerMode === 'string') {
            migratedState.developerMode = migratedState.developerMode.toLowerCase() === 'true' || migratedState.developerMode === '1';
          } else {
            migratedState.developerMode = Boolean(migratedState.developerMode);
          }
        } else {
          migratedState.developerMode = initialState.developerMode;
        }
        
        // Ensure featureFlags booleans are correct
        if (migratedState.featureFlags && typeof migratedState.featureFlags === 'object') {
          const migratedFlags = { ...migratedState.featureFlags };
          Object.keys(migratedFlags).forEach((key) => {
            if (migratedFlags[key] !== undefined && migratedFlags[key] !== null) {
              if (typeof migratedFlags[key] === 'string') {
                migratedFlags[key] = migratedFlags[key].toLowerCase() === 'true' || migratedFlags[key] === '1';
              } else {
                migratedFlags[key] = Boolean(migratedFlags[key]);
              }
            } else {
              migratedFlags[key] = initialState.featureFlags[key as keyof typeof initialState.featureFlags] ?? false;
            }
          });
          migratedState.featureFlags = migratedFlags;
        } else {
          migratedState.featureFlags = initialState.featureFlags;
        }
        
        // Ensure theme is a valid string
        if (!migratedState.theme || typeof migratedState.theme !== 'string' || !['light', 'dark', 'system'].includes(migratedState.theme)) {
          migratedState.theme = initialState.theme;
        }
        
        // Ensure currency is valid
        if (!migratedState.currency || typeof migratedState.currency !== 'string' || !['USD', 'EUR', 'GBP'].includes(migratedState.currency)) {
          migratedState.currency = initialState.currency;
        }
        
        // Ensure priceRefreshInterval is a number
        if (typeof migratedState.priceRefreshInterval !== 'number' || migratedState.priceRefreshInterval < 0) {
          migratedState.priceRefreshInterval = initialState.priceRefreshInterval;
        }
        
        return { ...initialState, ...migratedState } as AppState & AppActions;
      },
      version: 1,
    }
  )
);

// Selectors for common state combinations
export const useTheme = () => useAppStore((state) => state.theme);
export const useCurrency = () => useAppStore((state) => state.currency);
export const useFeatureFlags = () => useAppStore((state) => state.featureFlags);
export const useIsFirstLaunch = () => useAppStore((state) => state.isFirstLaunch);