import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { useCoinData } from '../token/useCoinData';
import { priceService } from '../../services/api/priceService';

// Import mock wallet structure (without prices)
import mockDevWallet from '../../mockData/api/dev-wallet.json';

export const useDevWallet = () => {
  const { connectDeveloperWallet, currentWallet } = useWalletStore();
  const { fetchCoinInfo, fetchChartData, formatPrice, formatMarketCap } = useCoinData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev wallet configuration with real crypto addresses
  const devWalletConfig = {
    id: 'developer-wallet',
    name: 'Developer Wallet',
    address: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
    publicKey: '0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0',
    network: 'ethereum' as const,
    tokens: [
      {
        coinId: 'bitcoin',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        symbol: 'BTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        balance: '35.5', // ~$2.3M in BTC
        logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
      },
      {
        coinId: 'ethereum',
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: '1250.875', // ~$4.2M in ETH
        logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      },
      {
        coinId: 'usd-coin',
        address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '5000000.00', // $5M USDC
        logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441abb619d3d5c9c5c27da6e6f4d91.png',
      },
      {
        coinId: 'tether',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        balance: '3000000.00', // $3M USDT
        logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
      },
      {
        coinId: 'binancecoin',
        address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        symbol: 'BNB',
        name: 'BNB',
        decimals: 18,
        balance: '15000.00', // ~$1M in BNB
        logoURI: 'https://tokens.1inch.io/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
      },
    ]
  };

  const connectDevWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔗 Connecting Dev Wallet...');

      // Fetch live prices for all tokens
      const coinIds = devWalletConfig.tokens.map(token => token.coinId);
      const livePrices = await priceService.fetchTopCoins(100);
      
      if (livePrices.success && livePrices.data) {
        const tokensWithPrices = devWalletConfig.tokens.map((token) => {
          const livePriceData = livePrices.data.find(coin => 
            coin.id === token.coinId || coin.symbol.toLowerCase() === token.symbol.toLowerCase()
          );
          
          if (livePriceData) {
            const tokenValue = parseFloat(token.balance) * livePriceData.current_price;
            return {
              ...token,
              currentPrice: livePriceData.current_price,
              priceChange24h: livePriceData.price_change_percentage_24h,
              marketCap: livePriceData.market_cap,
              usdValue: tokenValue,
            };
          }
          
          // Fallback if live data not available
          return {
            ...token,
            currentPrice: 0,
            priceChange24h: 0,
            marketCap: 0,
            usdValue: 0,
          };
        });

        // Calculate total portfolio value
        const totalValue = tokensWithPrices.reduce((sum, token) => sum + (token.usdValue || 0), 0);

        console.log('💰 Dev Wallet Portfolio:', {
          totalValue: `$${totalValue.toLocaleString()}`,
          tokens: tokensWithPrices.map(t => `${t.symbol}: $${t.usdValue?.toLocaleString()}`)
        });

        // Connect the wallet using the store
        connectDeveloperWallet();
        
        return {
          ...devWalletConfig,
          balance: '1250.875', // ETH balance
          tokens: tokensWithPrices,
          totalValue,
        };
      } else {
        throw new Error('Failed to fetch live price data');
      }
    } catch (err) {
      console.error('❌ Failed to connect dev wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect dev wallet');
      
      // Fallback to basic wallet connection without prices
      connectDeveloperWallet();
      return {
        ...devWalletConfig,
        balance: '1250.875',
        tokens: devWalletConfig.tokens.map(token => ({
          ...token,
          currentPrice: 0,
          priceChange24h: 0,
          marketCap: 0,
          usdValue: 0,
        })),
        totalValue: 0,
      };
    } finally {
      setIsLoading(false);
    }
  }, [connectDeveloperWallet]);

  const getTokenDetails = useCallback(async (coinId: string) => {
    try {
      // Fetch live data from CoinGecko
      const [coinInfo, chartData] = await Promise.all([
        priceService.fetchCoinInfo(coinId),
        priceService.fetchChartData(coinId, 30)
      ]);
      
      return {
        coinInfo: coinInfo.success ? coinInfo.data : null,
        chartData: chartData.success ? chartData.data : null,
      };
    } catch (err) {
      console.error('Failed to fetch token details:', err);
      return { coinInfo: null, chartData: null };
    }
  }, []);

  const refreshDevWallet = useCallback(async () => {
    if (currentWallet?.id === 'developer-wallet') {
      await connectDevWallet();
    }
  }, [currentWallet, connectDevWallet]);

  return {
    devWalletConfig,
    connectDevWallet,
    getTokenDetails,
    refreshDevWallet,
    isLoading,
    error,
  };
}; 