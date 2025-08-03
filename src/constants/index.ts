export * from './networks';

// API Configuration
export const API_ENDPOINTS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  JUPITER: 'https://quote-api.jup.ag/v6',
  ZEROX: 'https://api.0x.org',
} as const;

// App Configuration
export const APP_CONFIG = {
  SWAP_FEE_PERCENTAGE: 0.5, // 0.5% fee on swaps
  MIN_SWAP_FEE_USD: 1, // Minimum $1 fee
  MAX_SWAP_FEE_USD: 100, // Maximum $100 fee
  DEFAULT_SLIPPAGE: 1, // 1% default slippage
  PRICE_REFRESH_INTERVAL: 30000, // 30 seconds
  TRANSACTION_TIMEOUT: 60000, // 60 seconds
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  WALLET_DATA: 'wallet_data',
  PRIVATE_KEY: 'private_key',
  SETTINGS: 'app_settings',
  TRANSACTION_HISTORY: 'transaction_history',
  PRICE_CACHE: 'price_cache',
} as const;

// Common Tokens
export const COMMON_TOKENS = {
  ethereum: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    },
    {
      address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441abb619d3d5c9c5c27da6e6f4d91.png',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
    },
  ],
  solana: [
    {
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
  ],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  NETWORK_ERROR: 'Network error occurred',
  TRANSACTION_FAILED: 'Transaction failed',
  INVALID_ADDRESS: 'Invalid wallet address',
  SLIPPAGE_EXCEEDED: 'Price impact too high',
  USER_REJECTED: 'Transaction rejected by user',
} as const;

// Feature Flags
export const DEFAULT_FEATURE_FLAGS = {
  enableStaking: false,
  enableNFTs: false,
  enableWalletConnect: true,
  enableTestnets: false,
} as const;