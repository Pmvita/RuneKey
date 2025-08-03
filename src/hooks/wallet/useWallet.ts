import { useCallback, useEffect } from 'react';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { walletService } from '../../services/blockchain/walletService';
import { SupportedNetwork, Wallet } from '../../types';

export const useWallet = () => {
  const {
    isConnected,
    currentWallet,
    activeNetwork,
    transactions,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setLoading,
    setError,
    updateWalletBalance,
    updateTokenBalances,
  } = useWalletStore();

  /**
   * Generate a new wallet for the active network
   */
  const generateWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const wallet = await walletService.generateWallet(activeNetwork);
      await connectWallet(wallet);
      
      // Store private key securely (you'd get this from the generation process)
      // This is simplified - in practice you'd handle this more securely
      
      return wallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeNetwork, connectWallet, setLoading, setError]);

  /**
   * Import wallet from private key or mnemonic
   */
  const importWallet = useCallback(async (privateKeyOrMnemonic: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const wallet = await walletService.importWallet(privateKeyOrMnemonic, activeNetwork);
      await connectWallet(wallet);
      
      // Store private key securely
      await walletService.storePrivateKey(wallet.address, privateKeyOrMnemonic);
      
      return wallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeNetwork, connectWallet, setLoading, setError]);

  /**
   * Disconnect current wallet
   */
  const disconnect = useCallback(async () => {
    try {
      if (currentWallet) {
        await walletService.deletePrivateKey(currentWallet.address);
      }
      disconnectWallet();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  }, [currentWallet, disconnectWallet]);

  /**
   * Switch to a different network
   */
  const changeNetwork = useCallback(async (network: SupportedNetwork) => {
    try {
      setLoading(true);
      switchNetwork(network);
      
      // If wallet is connected, refresh balances for new network
      if (currentWallet) {
        await refreshBalances();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentWallet, switchNetwork, setLoading, setError]);

  /**
   * Refresh wallet balances
   */
  const refreshBalances = useCallback(async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);
      
      // Get native balance
      const balance = await walletService.getWalletBalance(currentWallet);
      updateWalletBalance(balance);
      
      // Get token balances
      const tokens = await walletService.getTokenBalances(currentWallet);
      updateTokenBalances(tokens);
      
    } catch (err) {
      console.error('Failed to refresh balances:', err);
      setError('Failed to refresh balances');
    } finally {
      setLoading(false);
    }
  }, [currentWallet, setLoading, setError, updateWalletBalance, updateTokenBalances]);

  /**
   * Send token or native currency
   */
  const sendToken = useCallback(async (
    toAddress: string,
    amount: string,
    token?: any
  ) => {
    if (!currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      setLoading(true);
      setError(null);
      
      const txHash = await walletService.sendToken(
        currentWallet,
        toAddress,
        amount,
        token
      );
      
      // Refresh balances after transaction
      await refreshBalances();
      
      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send token';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWallet, setLoading, setError, refreshBalances]);

  /**
   * Validate address format
   */
  const validateAddress = useCallback((address: string) => {
    return walletService.validateAddress(address, activeNetwork);
  }, [activeNetwork]);

  /**
   * Get transaction fee estimate
   */
  const estimateFee = useCallback(async (
    toAddress: string,
    amount: string,
    token?: any
  ) => {
    if (!currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      return await walletService.estimateTransactionFee(
        currentWallet,
        toAddress,
        amount,
        token
      );
    } catch (err) {
      console.error('Failed to estimate fee:', err);
      return '0';
    }
  }, [currentWallet]);

  // Auto-refresh balances when wallet connects or network changes
  useEffect(() => {
    if (currentWallet && isConnected) {
      refreshBalances();
    }
  }, [currentWallet, isConnected, activeNetwork, refreshBalances]);

  return {
    // State
    isConnected,
    currentWallet,
    activeNetwork,
    transactions,
    isLoading,
    error,
    
    // Actions
    generateWallet,
    importWallet,
    disconnect,
    changeNetwork,
    refreshBalances,
    sendToken,
    validateAddress,
    estimateFee,
  };
};