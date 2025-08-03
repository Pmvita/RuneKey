import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
// Note: SPL Token functionality temporarily disabled for React Native compatibility
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Wallet, Token, SupportedNetwork } from '../../types';
import { NETWORK_CONFIGS } from '../../constants';

class SolanaWalletService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(NETWORK_CONFIGS.solana.rpcUrl, 'confirmed');
  }

  /**
   * Generate a new Solana wallet
   */
  async generateWallet(): Promise<Wallet> {
    try {
      const keypair = Keypair.generate();
      
      const wallet: Wallet = {
        address: keypair.publicKey.toString(),
        publicKey: keypair.publicKey.toString(),
        network: 'solana',
        balance: '0',
        tokens: [],
      };

      return wallet;
    } catch (error) {
      console.error('Failed to generate Solana wallet:', error);
      throw new Error('Failed to generate Solana wallet');
    }
  }

  /**
   * Import Solana wallet from private key
   */
  async importWallet(privateKeyString: string): Promise<Wallet> {
    try {
      let keypair: Keypair;

      // Try to parse as array of numbers (exported from Phantom/Solflare)
      if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
        const privateKeyArray = JSON.parse(privateKeyString);
        keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
      } 
      // Try to parse as base58 string
      else if (privateKeyString.length === 88) {
        const privateKeyBytes = this.base58ToBytes(privateKeyString);
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      }
      // Try to parse as hex string
      else if (privateKeyString.startsWith('0x') || privateKeyString.length === 128) {
        const cleanHex = privateKeyString.replace('0x', '');
        const privateKeyBytes = new Uint8Array(
          cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else {
        throw new Error('Invalid private key format');
      }

      const wallet: Wallet = {
        address: keypair.publicKey.toString(),
        publicKey: keypair.publicKey.toString(),
        network: 'solana',
        balance: '0',
        tokens: [],
      };

      return wallet;
    } catch (error) {
      console.error('Failed to import Solana wallet:', error);
      throw new Error('Failed to import Solana wallet');
    }
  }

  /**
   * Get SOL balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      console.error('Failed to get Solana balance:', error);
      return '0';
    }
  }

  /**
   * Get SPL token balances
   * Note: Simplified for React Native compatibility
   */
  async getTokenBalances(address: string): Promise<Token[]> {
    try {
      // For now, return empty array for React Native compatibility
      // TODO: Implement proper SPL token support with React Native compatible packages
      console.log('SPL token balance fetching temporarily disabled for React Native compatibility');
      return [];
    } catch (error) {
      console.error('Failed to get Solana token balances:', error);
      return [];
    }
  }

  /**
   * Send SOL or SPL token
   */
  async sendToken(
    fromAddress: string,
    toAddress: string,
    amount: string,
    token?: Token
  ): Promise<string> {
    try {
      // This would require the private key to sign the transaction
      // In a real implementation, you'd need to handle signing differently
      throw new Error('Transaction signing not implemented - requires private key handling');
    } catch (error) {
      console.error('Failed to send Solana token:', error);
      throw error;
    }
  }

  /**
   * Validate Solana address
   */
  validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(
    fromAddress: string,
    toAddress: string,
    amount: string,
    token?: Token
  ): Promise<string> {
    try {
      // Solana has relatively fixed fees
      const recentBlockhash = await this.connection.getLatestBlockhash();
      
      // Base fee for SOL transfer
      if (!token) {
        return '0.000005'; // 5000 lamports
      }
      
      // SPL token transfer might require additional fees for account creation
      return '0.00001'; // 10000 lamports
    } catch (error) {
      console.error('Failed to estimate Solana fee:', error);
      return '0.000005';
    }
  }

  /**
   * Helper function to convert base58 to bytes
   */
  private base58ToBytes(base58: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = alphabet.length;
    
    let decoded = 0n;
    let multi = 1n;
    
    for (let i = base58.length - 1; i >= 0; i--) {
      const char = base58[i];
      const charIndex = alphabet.indexOf(char);
      if (charIndex === -1) throw new Error('Invalid base58 character');
      
      decoded += BigInt(charIndex) * multi;
      multi *= BigInt(base);
    }
    
    // Convert to bytes
    const bytes = [];
    while (decoded > 0n) {
      bytes.unshift(Number(decoded % 256n));
      decoded = decoded / 256n;
    }
    
    // Count leading zeros
    for (let i = 0; i < base58.length && base58[i] === '1'; i++) {
      bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
  }
}

export const solanaWalletService = new SolanaWalletService();