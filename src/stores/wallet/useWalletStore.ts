import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { WalletState, Wallet, Transaction, SupportedNetwork } from '../../types';
import { NETWORK_CONFIGS, DEFAULT_NETWORK, STORAGE_KEYS } from '../../constants';

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Failed to remove from secure storage:', error);
    }
  },
};

interface WalletActions {
  // Connection
  connectWallet: (wallet: Wallet) => void;
  disconnectWallet: () => void;
  
  // Network management
  switchNetwork: (network: SupportedNetwork) => void;
  
  // Transaction management
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Wallet updates
  updateWalletBalance: (balance: string) => void;
  updateTokenBalances: (tokens: any[]) => void;
  
  // Developer mode
  connectDeveloperWallet: () => void;
  
  // Utilities
  reset: () => void;
}

const initialState: WalletState = {
  isConnected: false,
  currentWallet: null,
  networks: Object.values(NETWORK_CONFIGS),
  activeNetwork: DEFAULT_NETWORK,
  transactions: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      connectWallet: (wallet: Wallet) => {
        set({
          isConnected: true,
          currentWallet: wallet,
          activeNetwork: wallet.network,
          error: null,
        });
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          currentWallet: null,
          transactions: [],
          error: null,
        });
      },

      switchNetwork: (network: SupportedNetwork) => {
        const { currentWallet } = get();
        if (currentWallet) {
          set({
            activeNetwork: network,
            currentWallet: {
              ...currentWallet,
              network,
            },
          });
        } else {
          set({ activeNetwork: network });
        }
      },

      addTransaction: (transaction: Transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        }));
      },

      updateTransaction: (hash: string, updates: Partial<Transaction>) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, ...updates } : tx
          ),
        }));
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      updateWalletBalance: (balance: string) => {
        const { currentWallet } = get();
        if (currentWallet) {
          set({
            currentWallet: {
              ...currentWallet,
              balance,
            },
          });
        }
      },

      updateTokenBalances: (tokens: any[]) => {
        const { currentWallet } = get();
        if (currentWallet) {
          set({
            currentWallet: {
              ...currentWallet,
              tokens,
            },
          });
        }
      },

      connectDeveloperWallet: () => {
        const mockWallet: Wallet = {
          id: 'developer-wallet',
          name: 'Developer Wallet',
          address: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
          publicKey: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
          network: 'ethereum',
          balance: '1250.875', // ETH amount that equals roughly $10.5M at current prices
          tokens: [
            {
              address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
              symbol: 'BTC',
              name: 'Wrapped Bitcoin',
              decimals: 8,
              balance: '35.5', // ~$2.3M in BTC
              logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
              coinId: 'bitcoin',
            },
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
              balance: '1250.875', // ~$4.2M in ETH
              logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
              coinId: 'ethereum',
            },
            {
              address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              balance: '5000000.00', // $5M USDC
              logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441abb619d3d5c9c5c27da6e6f4d91.png',
              coinId: 'usd-coin',
            },
            {
              address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              symbol: 'USDT',
              name: 'Tether USD',
              decimals: 6,
              balance: '3000000.00', // $3M USDT
              logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
              coinId: 'tether',
            },
            {
              address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
              symbol: 'BNB',
              name: 'BNB',
              decimals: 18,
              balance: '15000.00', // ~$1M in BNB
              logoURI: 'https://tokens.1inch.io/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
              coinId: 'binancecoin',
            },
          ]
        };

        set({
          isConnected: true,
          currentWallet: mockWallet,
          activeNetwork: 'ethereum',
          error: null,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.WALLET_DATA,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        isConnected: state.isConnected,
        activeNetwork: state.activeNetwork,
        transactions: state.transactions,
        // Don't persist wallet details for security
      }),
    }
  )
);