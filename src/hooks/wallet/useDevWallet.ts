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

  // Dev wallet configuration loaded from JSON file
  const devWalletConfig = {
    id: mockDevWallet.wallet.id,
    name: mockDevWallet.wallet.name,
    address: mockDevWallet.wallet.address,
    publicKey: mockDevWallet.wallet.publicKey,
    network: mockDevWallet.wallet.network as const,
    tokens: mockDevWallet.wallet.tokens.map(token => ({
      coinId: token.coinId,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      balance: token.balance.toString(),
      logoURI: token.logoURI,
    }))
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
          balance: mockDevWallet.wallet.balance,
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
        balance: mockDevWallet.wallet.balance,
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