import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { swapService } from '../../services/api/swapService';
import { SwapQuote, SwapParams, Token, Transaction } from '../../types';

export const useSwap = () => {
  const {
    currentWallet,
    activeNetwork,
    addTransaction,
    updateTransaction,
  } = useWalletStore();

  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(1); // 1% default
  const [quoteTimer, setQuoteTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Get swap quote
   */
  const getQuote = useCallback(async (params: SwapParams) => {
    if (!currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      const swapParams = {
        ...params,
        userAddress: currentWallet.address,
        slippage,
      };

      const result = await swapService.getSwapQuote(swapParams, activeNetwork);

      if (result.success) {
        setCurrentQuote(result.data);
        return result.data;
      } else {
        setError(result.error || 'Failed to get swap quote');
        setCurrentQuote(null);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get swap quote';
      setError(errorMessage);
      setCurrentQuote(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, activeNetwork, slippage]);

  /**
   * Get quote with auto-refresh
   */
  const getQuoteWithRefresh = useCallback(async (
    params: SwapParams,
    refreshInterval = 10000 // 10 seconds
  ) => {
    // Clear existing timer
    if (quoteTimer) {
      clearTimeout(quoteTimer);
    }

    // Get initial quote
    const quote = await getQuote(params);

    // Set up refresh timer
    const timer = setInterval(async () => {
      try {
        await getQuote(params);
      } catch (err) {
        console.error('Failed to refresh quote:', err);
      }
    }, refreshInterval);

    setQuoteTimer(timer);

    return quote;
  }, [getQuote, quoteTimer]);

  /**
   * Stop quote refresh
   */
  const stopQuoteRefresh = useCallback(() => {
    if (quoteTimer) {
      clearInterval(quoteTimer);
      setQuoteTimer(null);
    }
  }, [quoteTimer]);

  /**
   * Execute swap
   */
  const executeSwap = useCallback(async (quote: SwapQuote) => {
    if (!currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create pending transaction
      const pendingTransaction: Transaction = {
        hash: `pending_${Date.now()}`, // Temporary hash
        from: currentWallet.address,
        to: quote.outputToken.address,
        amount: quote.inputAmount,
        token: quote.inputToken,
        timestamp: Date.now(),
        status: 'pending',
        type: 'swap',
      };

      addTransaction(pendingTransaction);

      // Execute swap
      const result = await swapService.executeSwap(
        quote,
        activeNetwork,
        currentWallet.address
      );

      if (result.success) {
        // Update transaction with actual hash
        updateTransaction(pendingTransaction.hash, {
          hash: result.data,
          status: 'confirmed',
        });

        // Clear current quote
        setCurrentQuote(null);
        
        return result.data;
      } else {
        // Update transaction as failed
        updateTransaction(pendingTransaction.hash, {
          status: 'failed',
        });
        
        setError(result.error || 'Failed to execute swap');
        throw new Error(result.error || 'Failed to execute swap');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute swap';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, activeNetwork, addTransaction, updateTransaction]);

  /**
   * Validate swap parameters
   */
  const validateSwap = useCallback((params: SwapParams) => {
    const errors: string[] = [];

    if (!params.inputToken || !params.outputToken) {
      errors.push('Both input and output tokens are required');
    }

    if (params.inputToken?.address === params.outputToken?.address) {
      errors.push('Input and output tokens must be different');
    }

    if (!params.inputAmount || parseFloat(params.inputAmount) <= 0) {
      errors.push('Input amount must be greater than 0');
    }

    if (!currentWallet) {
      errors.push('Wallet not connected');
    }

    // Check if user has sufficient balance
    if (currentWallet && params.inputToken) {
      const inputToken = currentWallet.tokens.find(
        t => t.address === params.inputToken.address
      );
      
      if (params.inputToken.address === '0x0000000000000000000000000000000000000000' || 
          params.inputToken.address === 'So11111111111111111111111111111111111111112') {
        // Native token - check wallet balance
        if (parseFloat(currentWallet.balance) < parseFloat(params.inputAmount)) {
          errors.push('Insufficient balance');
        }
      } else if (inputToken) {
        // ERC-20/SPL token - check token balance
        if (parseFloat(inputToken.balance || '0') < parseFloat(params.inputAmount)) {
          errors.push('Insufficient token balance');
        }
      } else {
        errors.push('Token not found in wallet');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [currentWallet]);

  /**
   * Calculate price impact warning level
   */
  const getPriceImpactLevel = useCallback((priceImpact: number) => {
    if (priceImpact < 1) return 'low';
    if (priceImpact < 3) return 'medium';
    if (priceImpact < 5) return 'high';
    return 'warning';
  }, []);

  /**
   * Format swap route for display
   */
  const formatRoute = useCallback((route: any[]) => {
    if (!route || route.length === 0) return 'Direct';
    
    // This would depend on the DEX aggregator's route format
    // For Jupiter (Solana) and 0x (EVM), the formats differ
    if (activeNetwork === 'solana') {
      // Jupiter route format
      return route.map(step => step.swapInfo?.label || 'Unknown').join(' → ');
    } else {
      // 0x route format
      return route.map(source => source.name || 'Unknown').join(' → ');
    }
  }, [activeNetwork]);

  /**
   * Update slippage tolerance
   */
  const updateSlippage = useCallback((newSlippage: number) => {
    if (newSlippage >= 0.1 && newSlippage <= 50) {
      setSlippage(newSlippage);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (quoteTimer) {
        clearInterval(quoteTimer);
      }
    };
  }, [quoteTimer]);

  return {
    // State
    isLoading,
    currentQuote,
    error,
    slippage,
    
    // Actions
    getQuote,
    getQuoteWithRefresh,
    stopQuoteRefresh,
    executeSwap,
    updateSlippage,
    
    // Utilities
    validateSwap,
    getPriceImpactLevel,
    formatRoute,
    
    // Clear functions
    clearQuote: () => setCurrentQuote(null),
    clearError: () => setError(null),
  };
};