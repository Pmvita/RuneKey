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
    return prices[address]?.usd || null;
  },

  getTokenPriceChange: (address) => {
    const { prices } = get();
    return prices[address]?.usd_24h_change || null;
  },
}));

// Selectors
export const useTokenPrice = (address: string) =>
  usePriceStore((state) => state.prices[address]?.usd || null);

export const useTokenPriceChange = (address: string) =>
  usePriceStore((state) => state.prices[address]?.usd_24h_change || null);

export const usePricesLoading = () =>
  usePriceStore((state) => state.isLoading);

export const usePricesError = () =>
  usePriceStore((state) => state.error);