// Solana service is temporarily disabled for React Native compatibility
// @solana/web3.js is not installed, so we provide a stub implementation
// that throws when used, matching the original design intent.

import { Wallet, Token, SupportedNetwork } from '../../types';

// Stub implementation - Solana service is disabled
export class SolanaWalletService {
  private connection: any;

  constructor() {
    // Solana service disabled
    this.connection = null!;
  }

  /** Generate a new Solana wallet */
  async generateWallet(): Promise<Wallet> {
    throw new Error('Solana service is disabled');
  }

  /** Import wallet from private key */
  async importWallet(privateKey: string): Promise<Wallet> {
    throw new Error('Solana service is disabled');
  }

  /** Get wallet balance */
  async getWalletBalance(wallet: Wallet): Promise<string> {
    throw new Error('Solana service is disabled');
  }

  /** Get token balances */
  async getTokenBalances(wallet: Wallet): Promise<Token[]> {
    throw new Error('Solana service is disabled');
  }

  /** Send token */
  async sendToken(wallet: Wallet, toAddress: string, amount: string, token?: any): Promise<string> {
    throw new Error('Solana service is disabled');
  }

  /** Estimate transaction fee */
  async estimateTransactionFee(wallet: Wallet, toAddress: string, amount: string, token?: any): Promise<string> {
    throw new Error('Solana service is disabled');
  }

  /** Validate address */
  validateAddress(address: string, network: SupportedNetwork): boolean {
    throw new Error('Solana service is disabled');
  }
}

export const solanaWalletService = new SolanaWalletService();

// Note: SPL Token functionality temporarily disabled for React Native compatibility
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';