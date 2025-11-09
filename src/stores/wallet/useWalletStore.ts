import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WalletState, Wallet, Transaction, SupportedNetwork } from '../../types';
import { NETWORK_CONFIGS, DEFAULT_NETWORK, STORAGE_KEYS } from '../../constants';
import { secureStore } from '../../utils/secureStorage';

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await secureStore.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await secureStore.setItem(name, value);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await secureStore.deleteItem(name);
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

      connectDeveloperWallet: (liveData?: any) => {
        console.log('Connecting developer wallet...');
        
        try {
          // Load data from dev-wallet.json file
          const devWalletData = require('../../mockData/api/dev-wallet.json');
          console.log('📊 WalletStore: Loading Dev Mode Wallet from dev-wallet.json...');
          
          const mockWallet: Wallet = {
            id: devWalletData.wallet.id,
            name: devWalletData.wallet.name,
            address: devWalletData.wallet.address,
            publicKey: devWalletData.wallet.publicKey,
            network: devWalletData.wallet.network,
            balance: devWalletData.wallet.balance,
            tokens: devWalletData.wallet.tokens.map((token: any) => {
              // Use live data if available, otherwise use basic data
              const liveToken = liveData?.tokens?.find((t: any) => t.symbol === token.symbol);
              
              return {
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance: token.balance.toString(),
                logoURI: token.logoURI,
                coinId: token.coinId,
                // Add live price data if available
                currentPrice: liveToken?.currentPrice || 0,
                priceChange24h: liveToken?.priceChange24h || 0,
                marketCap: liveToken?.marketCap || 0,
                usdValue: liveToken?.usdValue || 0,
              };
            })
          };

          // Mock transactions from dev wallet data
          const mockTransactions = devWalletData.wallet.transactions.map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: tx.amount.toString(),
            token: {
              address: tx.token.address,
              symbol: tx.token.symbol,
              name: tx.token.name,
              decimals: tx.token.decimals,
              logoURI: devWalletData.wallet.tokens.find((t: any) => t.symbol === tx.token.symbol)?.logoURI || '',
              coinId: devWalletData.wallet.tokens.find((t: any) => t.symbol === tx.token.symbol)?.coinId || '',
            },
            timestamp: tx.timestamp,
            status: tx.status as const,
            type: tx.type as const,
            gasPrice: tx.gasPrice,
            gasUsed: tx.gasUsed
          }));

          set({
            isConnected: true,
            currentWallet: mockWallet,
            activeNetwork: 'ethereum',
            transactions: mockTransactions,
            error: null,
          });
          console.log('Developer wallet connected successfully');
        } catch (error) {
          console.error('Failed to load dev wallet data:', error);
          // Fallback to basic wallet structure if dev-wallet.json fails to load
          const fallbackWallet: Wallet = {
            id: 'developer-wallet',
            name: 'Developer Wallet',
            address: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
            publicKey: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
            network: 'ethereum',
            balance: '',
            tokens: []
          };

          set({
            isConnected: true,
            currentWallet: fallbackWallet,
            activeNetwork: 'ethereum',
            transactions: [],
            error: 'Failed to load dev wallet data',
          });
        }
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEYS.WALLET_DATA,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        // Only persist connection state, not wallet data
        isConnected: state.isConnected,
        activeNetwork: state.activeNetwork,
        transactions: state.transactions,
        // Don't persist wallet data - always read fresh from dev-wallet.json
      }),
    }
  )
);