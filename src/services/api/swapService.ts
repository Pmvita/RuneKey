import axios from 'axios';
import { API_ENDPOINTS, APP_CONFIG, EVM_NETWORKS, SOLANA_NETWORKS } from '../../constants';
import { SwapQuote, SwapParams, SupportedNetwork, ApiResponse } from '../../types';

class SwapService {
  /**
   * Get swap quote for any supported network
   */
  async getSwapQuote(params: SwapParams, network: SupportedNetwork): Promise<ApiResponse<SwapQuote>> {
    try {
      if (SOLANA_NETWORKS.includes(network)) {
        return {
          data: {} as SwapQuote,
          success: false,
          error: 'Solana swaps temporarily disabled for React Native compatibility',
        };
      } else if (EVM_NETWORKS.includes(network)) {
        return await this.getEvmSwapQuote(params, network);
      } else {
        return {
          data: {} as SwapQuote,
          success: false,
          error: `Unsupported network: ${network}`,
        };
      }
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return {
        data: {} as SwapQuote,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get swap quote from Jupiter for Solana
   */
  private async getSolanaSwapQuote(params: SwapParams): Promise<ApiResponse<SwapQuote>> {
    try {
      const { inputToken, outputToken, inputAmount, slippage } = params;
      
      // Convert input amount to lamports/token units
      const inputAmountLamports = Math.floor(
        parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)
      );

      const response = await axios.get(`${API_ENDPOINTS.JUPITER}/quote`, {
        params: {
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          amount: inputAmountLamports,
          slippageBps: Math.floor(slippage * 100), // Convert to basis points
        },
        timeout: 10000,
      });

      const quote = response.data;
      
      if (!quote || !quote.outAmount) {
        return {
          data: {} as SwapQuote,
          success: false,
          error: 'No route found for this swap',
        };
      }

      // Calculate our fee
      const outputAmountBeforeFee = parseFloat(quote.outAmount) / Math.pow(10, outputToken.decimals);
      const feeAmount = outputAmountBeforeFee * (APP_CONFIG.SWAP_FEE_PERCENTAGE / 100);
      const outputAmountAfterFee = outputAmountBeforeFee - feeAmount;

      const swapQuote: SwapQuote = {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: outputAmountAfterFee.toString(),
        priceImpact: quote.priceImpactPct || 0,
        route: quote.routePlan || [],
        slippage,
        exchangeRate: (outputAmountAfterFee / parseFloat(inputAmount)).toString(),
      };

      return {
        data: swapQuote,
        success: true,
      };
    } catch (error) {
      console.error('Jupiter API error:', error);
      return {
        data: {} as SwapQuote,
        success: false,
        error: error instanceof Error ? error.message : 'Jupiter API error',
      };
    }
  }

  /**
   * Get swap quote from 0x for EVM networks
   */
  private async getEvmSwapQuote(params: SwapParams, network: SupportedNetwork): Promise<ApiResponse<SwapQuote>> {
    try {
      const { inputToken, outputToken, inputAmount, slippage, userAddress } = params;
      
      // Convert input amount to wei/token units
      const inputAmountWei = Math.floor(
        parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)
      ).toString();

      // Get chain ID for the network
      const chainId = this.getChainId(network);
      if (!chainId) {
        return {
          data: {} as SwapQuote,
          success: false,
          error: `Unsupported network: ${network}`,
        };
      }

      const response = await axios.get(`${API_ENDPOINTS.ZEROX}/swap/v1/quote`, {
        params: {
          sellToken: inputToken.address === '0x0000000000000000000000000000000000000000' 
            ? 'ETH' 
            : inputToken.address,
          buyToken: outputToken.address === '0x0000000000000000000000000000000000000000' 
            ? 'ETH' 
            : outputToken.address,
          sellAmount: inputAmountWei,
          slippagePercentage: slippage / 100,
          takerAddress: userAddress,
        },
        headers: {
          'X-Chain-Id': chainId.toString(),
        },
        timeout: 10000,
      });

      const quote = response.data;
      
      if (!quote || !quote.buyAmount) {
        return {
          data: {} as SwapQuote,
          success: false,
          error: 'No route found for this swap',
        };
      }

      // Calculate our fee
      const outputAmountBeforeFee = parseFloat(quote.buyAmount) / Math.pow(10, outputToken.decimals);
      const feeAmount = outputAmountBeforeFee * (APP_CONFIG.SWAP_FEE_PERCENTAGE / 100);
      const outputAmountAfterFee = outputAmountBeforeFee - feeAmount;

      const swapQuote: SwapQuote = {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: outputAmountAfterFee.toString(),
        priceImpact: quote.priceImpactPct || 0,
        route: quote.sources || [],
        estimatedGas: quote.gas,
        slippage,
        exchangeRate: (outputAmountAfterFee / parseFloat(inputAmount)).toString(),
      };

      return {
        data: swapQuote,
        success: true,
      };
    } catch (error) {
      console.error('0x API error:', error);
      return {
        data: {} as SwapQuote,
        success: false,
        error: error instanceof Error ? error.message : '0x API error',
      };
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(
    quote: SwapQuote, 
    network: SupportedNetwork, 
    userAddress: string
  ): Promise<ApiResponse<string>> {
    try {
      if (SOLANA_NETWORKS.includes(network)) {
        return {
          data: '',
          success: false,
          error: 'Solana swaps temporarily disabled for React Native compatibility',
        };
      } else if (EVM_NETWORKS.includes(network)) {
        return await this.executeEvmSwap(quote, userAddress, network);
      } else {
        return {
          data: '',
          success: false,
          error: `Unsupported network: ${network}`,
        };
      }
    } catch (error) {
      console.error('Failed to execute swap:', error);
      return {
        data: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeSolanaSwap(quote: SwapQuote, userAddress: string): Promise<ApiResponse<string>> {
    try {
      // Get serialized transaction from Jupiter
      const response = await axios.post(`${API_ENDPOINTS.JUPITER}/swap`, {
        quoteResponse: quote.route,
        userPublicKey: userAddress,
        wrapAndUnwrapSol: true,
      });

      return {
        data: response.data.swapTransaction,
        success: true,
      };
    } catch (error) {
      return {
        data: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute Solana swap',
      };
    }
  }

  private async executeEvmSwap(
    quote: SwapQuote, 
    userAddress: string, 
    network: SupportedNetwork
  ): Promise<ApiResponse<string>> {
    try {
      const chainId = this.getChainId(network);
      
      const response = await axios.get(`${API_ENDPOINTS.ZEROX}/swap/v1/quote`, {
        params: {
          sellToken: quote.inputToken.address,
          buyToken: quote.outputToken.address,
          sellAmount: Math.floor(
            parseFloat(quote.inputAmount) * Math.pow(10, quote.inputToken.decimals)
          ).toString(),
          takerAddress: userAddress,
        },
        headers: {
          'X-Chain-Id': chainId?.toString(),
        },
      });

      return {
        data: response.data.data, // Transaction data
        success: true,
      };
    } catch (error) {
      return {
        data: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute EVM swap',
      };
    }
  }

  private getChainId(network: SupportedNetwork): number | null {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      bsc: 56,
      avalanche: 43114,
      arbitrum: 42161,
      optimism: 10,
    };

    return chainIds[network] || null;
  }
}

export const swapService = new SwapService();