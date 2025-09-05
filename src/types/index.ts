// Core Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  balanceUSD?: number;
  price?: number;
  priceChange24h?: number;
  coinId?: string;
  usdValue?: number;
  currentPrice?: number;
  marketCap?: number;
}

export interface Wallet {
  id?: string;
  address: string;
  publicKey: string;
  network: SupportedNetwork;
  balance: string;
  tokens: Token[];
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: Token;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive' | 'swap';
  gasPrice?: string;
  gasUsed?: string;
}

export interface SwapQuote {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  route: any[];
  estimatedGas?: string;
  slippage: number;
  exchangeRate: string;
}

export interface SwapParams {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  slippage: number;
  userAddress: string;
}

// Network Types
export type SupportedNetwork = 
  | 'ethereum' 
  | 'polygon' 
  | 'bsc' 
  | 'avalanche' 
  | 'solana' 
  | 'arbitrum' 
  | 'optimism';

export interface NetworkConfig {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId?: number;
  isTestnet?: boolean;
  icon: string;
}

// Store Types
export interface WalletState {
  isConnected: boolean;
  currentWallet: Wallet | null;
  networks: NetworkConfig[];
  activeNetwork: SupportedNetwork;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  isFirstLaunch: boolean;
  featureFlags: {
    enableStaking: boolean;
    enableNFTs: boolean;
    enableWalletConnect: boolean;
    enableTestnets: boolean;
  };
  priceRefreshInterval: number;
  developerMode: boolean;
}

// API Types
export interface PriceData {
  [tokenAddress: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  TokenDetails: {
    token: Token;
  };
  Swap: {
    selectedToken?: Token;
  };
  Send: {
    selectedToken?: Token;
  };
  Receive: {
    selectedToken?: Token;
  };
  Home: undefined;
  Wallet: undefined;
  Settings: undefined;
  QRScanner: {
    onScan: (data: string) => void;
  };
  TransactionHistory: undefined;
  WalletConnect: undefined;
};

// Component Props Types
export interface TokenListItemProps {
  token: Token;
  onPress?: () => void;
}

export interface SwapFormProps {
  onSwap: (params: SwapParams) => void;
  isLoading?: boolean;
}

export interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

// Error Types
export interface WalletError {
  code: string;
  message: string;
  data?: any;
}

export interface SwapError {
  type: 'insufficient_balance' | 'slippage_exceeded' | 'network_error' | 'user_rejected';
  message: string;
  details?: any;
}