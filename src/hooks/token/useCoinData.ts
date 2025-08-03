import { useState, useCallback } from 'react';
import { priceService, CoinInfo, ChartData } from '../../services/api/priceService';

export const useCoinData = () => {
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [topCoins, setTopCoins] = useState<CoinInfo[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch detailed information for a specific coin
   */
  const fetchCoinInfo = useCallback(async (coinId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await priceService.fetchCoinInfo(coinId);
      
      if (result.success) {
        setCoinInfo(result.data);
      } else {
        setError(result.error || 'Failed to fetch coin info');
      }
    } catch (err) {
      console.error('Failed to fetch coin info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch chart data for a coin
   */
  const fetchChartData = useCallback(async (
    coinId: string, 
    days: number = 30, 
    currency: string = 'usd'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await priceService.fetchChartData(coinId, days, currency);
      
      if (result.success) {
        setChartData(result.data);
      } else {
        setError(result.error || 'Failed to fetch chart data');
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch top coins by market cap
   */
  const fetchTopCoins = useCallback(async (limit: number = 100) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await priceService.fetchTopCoins(limit);
      
      if (result.success) {
        setTopCoins(result.data);
      } else {
        setError(result.error || 'Failed to fetch top coins');
      }
    } catch (err) {
      console.error('Failed to fetch top coins:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search for coins
   */
  const searchCoins = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await priceService.searchCoins(query);
      
      if (result.success) {
        setSearchResults(result.data);
      } else {
        setError(result.error || 'Failed to search coins');
      }
    } catch (err) {
      console.error('Failed to search coins:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setCoinInfo(null);
    setChartData(null);
    setTopCoins([]);
    setSearchResults([]);
    setError(null);
  }, []);

  /**
   * Format price with currency symbol
   */
  const formatPrice = useCallback((price: number, currency: string = 'USD') => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
    };

    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || '$';
    
    return `${symbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    })}`;
  }, []);

  /**
   * Format percentage change
   */
  const formatPercentageChange = useCallback((change: number) => {
    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(2);
    
    return {
      value: change,
      formatted: `${isPositive ? '+' : '-'}${formattedChange}%`,
      isPositive,
    };
  }, []);

  /**
   * Format market cap
   */
  const formatMarketCap = useCallback((marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `$${(marketCap / 1e3).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  }, []);

  /**
   * Format volume
   */
  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1e12) {
      return `$${(volume / 1e12).toFixed(2)}T`;
    } else if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  }, []);

  return {
    // State
    coinInfo,
    chartData,
    topCoins,
    searchResults,
    isLoading,
    error,
    
    // Actions
    fetchCoinInfo,
    fetchChartData,
    fetchTopCoins,
    searchCoins,
    clearData,
    
    // Utilities
    formatPrice,
    formatPercentageChange,
    formatMarketCap,
    formatVolume,
  };
}; 