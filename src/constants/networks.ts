import { NetworkConfig, SupportedNetwork } from '../types';

export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: 'https://ethereum.rpc.thirdweb.com',
    explorerUrl: 'https://etherscan.io',
    icon: '⟠',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: 'https://polygon.rpc.thirdweb.com',
    explorerUrl: 'https://polygonscan.com',
    icon: '⬟',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: 'https://bsc.rpc.thirdweb.com',
    explorerUrl: 'https://bscscan.com',
    icon: '🟡',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    rpcUrl: 'https://avalanche.rpc.thirdweb.com',
    explorerUrl: 'https://snowtrace.io',
    icon: '🔺',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrl: 'https://arbitrum.rpc.thirdweb.com',
    explorerUrl: 'https://arbiscan.io',
    icon: '🔵',
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: 10,
    rpcUrl: 'https://optimism.rpc.thirdweb.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    icon: '🔴',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    icon: '🟣',
  },
};

export const DEFAULT_NETWORK: SupportedNetwork = 'ethereum';

export const EVM_NETWORKS: SupportedNetwork[] = [
  'ethereum',
  'polygon',
  'bsc',
  'avalanche',
  'arbitrum',
  'optimism',
];

export const SOLANA_NETWORKS: SupportedNetwork[] = ['solana'];

// Temporarily exclude Solana due to React Native compatibility issues
export const SUPPORTED_NETWORKS = Object.keys(NETWORK_CONFIGS).filter(
  network => network !== 'solana'
) as SupportedNetwork[];