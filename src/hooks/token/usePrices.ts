import { useCallback, useEffect, useRef } from 'react';
import { usePriceStore } from '../../stores/app/usePriceStore';
import { useAppStore } from '../../stores/app/useAppStore';
import { priceService } from '../../services/api/priceService';

export const usePrices = () => {
  const {
    prices,
    isLoading,
    lastUpdated,
    error,
    setPrices,
    setLoading,
    setError,
    updateTokenPrice,
    clearPrices,
    getTokenPrice,
    getTokenPriceChange,
  } = usePriceStore();

  const { priceRefreshInterval } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch prices for given token addresses
   */
  const fetchPrices = useCallback(async (tokenAddresses: string[]) => {
    if (tokenAddresses.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await priceService.fetchTokenPrices(tokenAddresses);
      
      if (result.success) {
        setPrices(result.data);
      } else {
        setError(result.error || 'Failed to fetch prices');
      }
    } catch (err) {
      console.error('Failed to fetch token prices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [setPrices, setLoading, setError]);

  /**
   * Fetch single token price
   */
  const fetchTokenPrice = useCallback(async (tokenAddress: string) => {
    try {
      const result = await priceService.fetchTokenPrice(tokenAddress);
      
      if (result.success) {
        updateTokenPrice(tokenAddress, result.data, 0);
        return result.data;
      } else {
        console.error('Failed to fetch token price:', result.error);
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch token price:', err);
      return null;
    }
  }, [updateTokenPrice]);

  /**
   * Start automatic price refresh
   */
  const startPriceRefresh = useCallback((tokenAddresses: string[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial fetch
    fetchPrices(tokenAddresses);

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchPrices(tokenAddresses);
    }, priceRefreshInterval);
  }, [fetchPrices, priceRefreshInterval]);

  /**
   * Stop automatic price refresh
   */
  const stopPriceRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Check if prices need refresh
   */
  const needsRefresh = useCallback((maxAgeMs: number = 60000) => { // 1 minute default
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > maxAgeMs;
  }, [lastUpdated]);

  /**
   * Conditionally refresh prices if stale
   */
  const refreshIfStale = useCallback(async (
    tokenAddresses: string[],
    maxAgeMs?: number
  ) => {
    if (needsRefresh(maxAgeMs)) {
      await fetchPrices(tokenAddresses);
    }
  }, [needsRefresh, fetchPrices]);

  /**
   * Get formatted price with currency symbol
   */
  const getFormattedPrice = useCallback((tokenAddress: string, currency = 'USD') => {
    const price = getTokenPrice(tokenAddress);
    
    if (!price) return null;

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
  }, [getTokenPrice]);

  /**
   * Get formatted price change percentage
   */
  const getFormattedPriceChange = useCallback((tokenAddress: string) => {
    const change = getTokenPriceChange(tokenAddress);
    
    if (change === null) return null;

    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(2);
    
    return {
      value: change,
      formatted: `${isPositive ? '+' : '-'}${formattedChange}%`,
      isPositive,
    };
  }, [getTokenPriceChange]);

  /**
   * Calculate USD value for token amount
   */
  const calculateUSDValue = useCallback((
    tokenAddress: string,
    amount: string | number
  ) => {
    const price = getTokenPrice(tokenAddress);
    
    if (!price) return null;

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return price * numericAmount;
  }, [getTokenPrice]);

  /**
   * Get trending tokens
   */
  const fetchTrendingTokens = useCallback(async () => {
    try {
      const result = await priceService.fetchTrendingTokens();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('Failed to fetch trending tokens:', result.error);
        return [];
      }
    } catch (err) {
      console.error('Failed to fetch trending tokens:', err);
      return [];
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    prices,
    isLoading,
    lastUpdated,
    error,
    
    // Actions
    fetchPrices,
    fetchTokenPrice,
    startPriceRefresh,
    stopPriceRefresh,
    refreshIfStale,
    clearPrices,
    
    // Utilities
    getTokenPrice,
    getTokenPriceChange,
    getFormattedPrice,
    getFormattedPriceChange,
    calculateUSDValue,
    needsRefresh,
    
    // Additional features
    fetchTrendingTokens,
  };
};