import { Platform } from 'react-native';
import { Wallet, Token, SupportedNetwork } from '../../types';
import { NETWORK_CONFIGS } from '../../constants';

// Conditional imports - viem has issues with web bundling
// Use dynamic require that won't be analyzed by bundler
let viem: any;
let viemAccounts: any;
let viemChains: any;

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  try {
    // Only import viem on native platforms
    // This will be intercepted by Metro resolver on web
    viem = require('viem');
    viemAccounts = require('viem/accounts');
    viemChains = require('viem/chains');
  } catch (error) {
    // On web, these requires will fail or return empty, which is expected
    if (!isWeb) {
      console.warn('Failed to load viem:', error);
    }
  }
}

class EvmWalletService {
  private getChain(network: SupportedNetwork) {
    if (Platform.OS === 'web') {
      // Return minimal chain config for web
      return { id: 1, name: 'Ethereum', network: 'homestead' };
    }
    
    const chains = {
      ethereum: viemChains.mainnet,
      polygon: viemChains.polygon,
      bsc: viemChains.bsc,
      avalanche: viemChains.avalanche,
      arbitrum: viemChains.arbitrum,
      optimism: viemChains.optimism,
    };
    return chains[network as keyof typeof chains];
  }

  private getPublicClient(network: SupportedNetwork) {
    if (Platform.OS === 'web') {
      // Return mock client for web
      return null;
    }
    
    const chain = this.getChain(network);
    const config = NETWORK_CONFIGS[network];
    
    return viem.createPublicClient({
      chain,
      transport: viem.http(config.rpcUrl),
    });
  }

  /**
   * Generate a new EVM wallet
   */
  async generateWallet(network: SupportedNetwork): Promise<Wallet> {
    if (Platform.OS === 'web') {
      throw new Error('Wallet generation is not available on web platform. Please use a mobile device.');
    }
    
    try {
      const privateKey = viemAccounts.generatePrivateKey();
      const account = viemAccounts.privateKeyToAccount(privateKey);
      
      const wallet: Wallet = {
        address: account.address,
        publicKey: account.address,
        network,
        balance: '0',
        tokens: [],
      };

      return wallet;
    } catch (error) {
      console.error('Failed to generate EVM wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Import EVM wallet from private key
   */
  async importWallet(privateKey: string, network: SupportedNetwork): Promise<Wallet> {
    try {
      // Ensure private key has 0x prefix
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      
      const account = viemAccounts.privateKeyToAccount(formattedPrivateKey as `0x${string}`);
      
      const wallet: Wallet = {
        address: account.address,
        publicKey: account.address,
        network,
        balance: '0',
        tokens: [],
      };

      return wallet;
    } catch (error) {
      console.error('Failed to import EVM wallet:', error);
      throw new Error('Failed to import EVM wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string, network: SupportedNetwork): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Balance checking is not available on web platform. Please use a mobile device.');
    }
    
    try {
      // Validate address format - trim whitespace and check format
      const cleanAddress = address?.trim();
      if (!cleanAddress || !cleanAddress.startsWith('0x') || cleanAddress.length !== 42 || !/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
        console.warn('Invalid address format:', address);
        return '0';
      }

      const client = this.getPublicClient(network);
      const balance = await client.getBalance({ 
        address: cleanAddress as `0x${string}`,
      });
      
      return viem.formatEther(balance);
    } catch (error) {
      console.error('Failed to get EVM balance:', error);
      return '0';
    }
  }

  /**
   * Get ERC-20 token balances
   */
  async getTokenBalances(address: string, network: SupportedNetwork): Promise<Token[]> {
    try {
      // Validate address format - trim whitespace and check format
      const cleanAddress = address?.trim();
      if (!cleanAddress || !cleanAddress.startsWith('0x') || cleanAddress.length !== 42 || !/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
        console.warn('Invalid address format:', address);
        return [];
      }

      const client = this.getPublicClient(network);
      
      // This is a simplified implementation
      // In a real app, you'd want to:
      // 1. Get token list from a service like CoinGecko or TokenLists
      // 2. Query each token contract for balance
      // 3. Filter out zero balances
      
      const tokens: Token[] = [];
      
      // Example: USDC balance check
      // You would iterate through known token contracts here
      const usdcAddresses = {
        ethereum: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        // Add more as needed
      };
      
      const usdcAddress = usdcAddresses[network as keyof typeof usdcAddresses];
      
      if (usdcAddress) {
        try {
          const balance = await client.readContract({
            address: usdcAddress as `0x${string}`,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }],
              },
              {
                name: 'decimals',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'uint8' }],
              },
            ],
            functionName: 'balanceOf',
            args: [cleanAddress as `0x${string}`],
          });
          
          if (balance && balance > 0n) {
            const decimals = await client.readContract({
              address: usdcAddress as `0x${string}`,
              abi: [
                {
                  name: 'decimals',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [],
                  outputs: [{ name: '', type: 'uint8' }],
                },
              ],
              functionName: 'decimals',
            });
            
            const formattedBalance = (Number(balance) / Math.pow(10, Number(decimals))).toString();
            
            tokens.push({
              address: usdcAddress,
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: Number(decimals),
              balance: formattedBalance,
            });
          }
        } catch (error) {
          console.error('Failed to get USDC balance:', error);
        }
      }

      return tokens;
    } catch (error) {
      console.error('Failed to get EVM token balances:', error);
      return [];
    }
  }

  /**
   * Send native token or ERC-20 token
   */
  async sendToken(
    fromAddress: string,
    toAddress: string,
    amount: string,
    network: SupportedNetwork,
    token?: Token
  ): Promise<string> {
    try {
      // This would require the private key to sign the transaction
      // In a real implementation, you'd need to handle signing differently
      throw new Error('Transaction signing not implemented - requires private key handling');
    } catch (error) {
      console.error('Failed to send EVM token:', error);
      throw error;
    }
  }

  /**
   * Validate EVM address
   */
  validateAddress(address: string): boolean {
    try {
      // Basic EVM address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address);
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
    network: SupportedNetwork,
    token?: Token
  ): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Fee estimation is not available on web platform. Please use a mobile device.');
    }
    
    try {
      const client = this.getPublicClient(network);
      
      if (!token) {
        // Native token transfer
        const gasEstimate = await client.estimateGas({
          account: fromAddress as `0x${string}`,
          to: toAddress as `0x${string}`,
          value: viem.parseEther(amount),
        });
        
        const gasPrice = await client.getGasPrice();
        const fee = gasEstimate * gasPrice;
        
        return viem.formatEther(fee);
      } else {
        // ERC-20 token transfer
        const gasEstimate = await client.estimateContractGas({
          address: token.address as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [
            toAddress as `0x${string}`,
            BigInt(Math.floor(parseFloat(amount) * Math.pow(10, token.decimals))),
          ],
          account: fromAddress as `0x${string}`,
        });
        
        const gasPrice = await client.getGasPrice();
        const fee = gasEstimate * gasPrice;
        
        return viem.formatEther(fee);
      }
    } catch (error) {
      console.error('Failed to estimate EVM fee:', error);
      return '0.001'; // Fallback estimate
    }
  }
}

export const evmWalletService = new EvmWalletService();