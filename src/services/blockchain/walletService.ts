import * as SecureStore from 'expo-secure-store';
import { Wallet, SupportedNetwork, Token } from '../../types';
import { STORAGE_KEYS, COMMON_TOKENS } from '../../constants';
// import { solanaWalletService } from './solanaService'; // Temporarily disabled for React Native compatibility
import { evmWalletService } from './evmService';

export class WalletService {
  /**
   * Generate a new wallet for the specified network
   */
  async generateWallet(network: SupportedNetwork): Promise<Wallet> {
    try {
      if (network === 'solana') {
        throw new Error('Solana support temporarily disabled for React Native compatibility');
      } else {
        return await evmWalletService.generateWallet(network);
      }
    } catch (error) {
      console.error('Failed to generate wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Import wallet from private key or mnemonic
   */
  async importWallet(
    privateKeyOrMnemonic: string, 
    network: SupportedNetwork
  ): Promise<Wallet> {
    try {
      if (network === 'solana') {
        throw new Error('Solana support temporarily disabled for React Native compatibility');
      } else {
        return await evmWalletService.importWallet(privateKeyOrMnemonic, network);
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      throw new Error('Failed to import wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(wallet: Wallet): Promise<string> {
    try {
      if (wallet.network === 'solana') {
        console.warn('Solana support temporarily disabled for React Native compatibility');
        return '0';
      } else {
        return await evmWalletService.getBalance(wallet.address, wallet.network);
      }
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get token balances for a wallet
   */
  async getTokenBalances(wallet: Wallet): Promise<Token[]> {
    try {
      if (wallet.network === 'solana') {
        console.warn('Solana support temporarily disabled for React Native compatibility');
        return [];
      } else {
        return await evmWalletService.getTokenBalances(wallet.address, wallet.network);
      }
    } catch (error) {
      console.error('Failed to get token balances:', error);
      return [];
    }
  }

  /**
   * Send native token
   */
  async sendToken(
    wallet: Wallet,
    toAddress: string,
    amount: string,
    token?: Token
  ): Promise<string> {
    try {
      if (wallet.network === 'solana') {
        throw new Error('Solana support temporarily disabled for React Native compatibility');
      } else {
        return await evmWalletService.sendToken(
          wallet.address,
          toAddress,
          amount,
          wallet.network,
          token
        );
      }
    } catch (error) {
      console.error('Failed to send token:', error);
      throw new Error('Failed to send token');
    }
  }

  /**
   * Validate wallet address format
   */
  validateAddress(address: string, network: SupportedNetwork): boolean {
    try {
      if (network === 'solana') {
        console.warn('Solana support temporarily disabled for React Native compatibility');
        return false;
      } else {
        return evmWalletService.validateAddress(address);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      return false;
    }
  }

  /**
   * Securely store private key
   */
  async storePrivateKey(address: string, privateKey: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        `${STORAGE_KEYS.PRIVATE_KEY}_${address}`,
        privateKey
      );
    } catch (error) {
      console.error('Failed to store private key:', error);
      throw new Error('Failed to store private key');
    }
  }

  /**
   * Retrieve private key from secure storage
   */
  async getPrivateKey(address: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`${STORAGE_KEYS.PRIVATE_KEY}_${address}`);
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  /**
   * Delete private key from secure storage
   */
  async deletePrivateKey(address: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${STORAGE_KEYS.PRIVATE_KEY}_${address}`);
    } catch (error) {
      console.error('Failed to delete private key:', error);
    }
  }

  /**
   * Get common tokens for a network
   */
  getCommonTokens(network: SupportedNetwork): Token[] {
    if (network === 'solana') {
      return COMMON_TOKENS.solana;
    } else {
      return COMMON_TOKENS.ethereum; // Use ethereum tokens for all EVM networks
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(
    wallet: Wallet,
    toAddress: string,
    amount: string,
    token?: Token
  ): Promise<string> {
    try {
      if (wallet.network === 'solana') {
        console.warn('Solana support temporarily disabled for React Native compatibility');
        return '0';
      } else {
        return await evmWalletService.estimateFee(
          wallet.address,
          toAddress,
          amount,
          wallet.network,
          token
        );
      }
    } catch (error) {
      console.error('Failed to estimate transaction fee:', error);
      return '0';
    }
  }
}

export const walletService = new WalletService();