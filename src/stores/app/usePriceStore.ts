import { create } from 'zustand';
import { PriceData } from '../../types';

interface PriceState {
  prices: PriceData;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
}

interface PriceActions {
  setPrices: (prices: PriceData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTokenPrice: (address: string, price: number, change24h: number) => void;
  clearPrices: () => void;
  getTokenPrice: (address: string) => number | null;
  getTokenPriceChange: (address: string) => number | null;
}

// Fallback prices for development mode when API fails
const FALLBACK_PRICES: Record<string, number> = {
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 51200, // BTC
  '0x0000000000000000000000000000000000000000': 3200,  // ETH
  '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91': 1,     // USDC
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': 1,      // USDT
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 312,   // BNB
};

const initialState: PriceState = {
  prices: {},
  isLoading: false,
  lastUpdated: null,
  error: null,
};

export const usePriceStore = create<PriceState & PriceActions>()((set, get) => ({
  ...initialState,

  setPrices: (prices) => {
    set({
      prices,
      lastUpdated: Date.now(),
      error: null,
      isLoading: false,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  updateTokenPrice: (address, price, change24h) => {
    set((state) => ({
      prices: {
        ...state.prices,
        [address]: {
          usd: price,
          usd_24h_change: change24h,
          last_updated_at: Date.now(),
        },
      },
      lastUpdated: Date.now(),
    }));
  },

  clearPrices: () => {
    set({ prices: {}, lastUpdated: null, error: null });
  },

  getTokenPrice: (address) => {
    const { prices } = get();
    // Return fallback price if no price is available (for development mode)
    return prices[address]?.usd || FALLBACK_PRICES[address] || null;
  },

  getTokenPriceChange: (address) => {
    const { prices } = get();
    // Return fallback price change if no change is available (for development mode)
    return prices[address]?.usd_24h_change || 0;
  },
}));

// Selectors
export const useTokenPrice = (address: string) =>
  usePriceStore((state) => state.getTokenPrice(address));

export const useTokenPriceChange = (address: string) =>
  usePriceStore((state) => state.getTokenPriceChange(address));

export const usePricesLoading = () =>
  usePriceStore((state) => state.isLoading);

export const usePricesError = () =>
  usePriceStore((state) => state.error);