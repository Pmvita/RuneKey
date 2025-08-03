import axios from 'axios';
import { API_ENDPOINTS } from '../../constants';
import { PriceData, ApiResponse } from '../../types';
import cryptoPricesData from '../../mockData/api/crypto-prices.json';
import chartData from '../../mockData/api/chart-data.json';

// Enhanced types for coin data
export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface ChartDataPoint {
  price: number;
  timestamp: number;
}

export interface ChartData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

class PriceService {
  private baseURL = API_ENDPOINTS.COINGECKO;
  private useMockData = false; // Flag to use mock data when API fails

  /**
   * Fetch token prices from CoinGecko
   */
  async fetchTokenPrices(tokenAddresses: string[]): Promise<ApiResponse<PriceData>> {
    try {
      if (tokenAddresses.length === 0) {
        return { data: {}, success: true };
      }

      // Convert addresses to CoinGecko format
      const formattedAddresses = tokenAddresses
        .map(address => this.formatAddressForCoingecko(address))
        .filter(Boolean)
        .join(',');

      if (!formattedAddresses) {
        return { data: {}, success: true };
      }

      const response = await axios.get(
        `${this.baseURL}/simple/price`,
        {
          params: {
            ids: formattedAddresses,
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_last_updated_at: true,
          },
          timeout: 10000,
        }
      );

      // Transform response to match our PriceData interface
      const transformedData: PriceData = {};
      
      Object.entries(response.data).forEach(([coinId, priceInfo]: [string, any]) => {
        const originalAddress = this.getOriginalAddress(coinId, tokenAddresses);
        if (originalAddress) {
          transformedData[originalAddress] = {
            usd: priceInfo.usd || 0,
            usd_24h_change: priceInfo.usd_24h_change || 0,
            last_updated_at: priceInfo.last_updated_at || Date.now(),
          };
        }
      });

      return {
        data: transformedData,
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {
        data: {},
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch detailed coin information
   */
  async fetchCoinInfo(coinId: string): Promise<ApiResponse<CoinInfo>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/coins/${coinId}`,
        {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
          },
          timeout: 10000,
        }
      );

      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch coin info:', error);
      
      // Fallback to mock data
      const mockCoinId = this.getMockCoinId(coinId);
      if (mockCoinId && cryptoPricesData[mockCoinId]) {
        console.log('Using mock data for coin info:', coinId);
        return {
          data: cryptoPricesData[mockCoinId] as CoinInfo,
          success: true,
        };
      }
      
      return {
        data: {} as CoinInfo,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch chart data for a coin
   */
  async fetchChartData(
    coinId: string, 
    days: number = 30, 
    currency: string = 'usd'
  ): Promise<ApiResponse<ChartData>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days: days,
            interval: days <= 1 ? 'hourly' : 'daily',
          },
          timeout: 15000,
        }
      );

      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      
      // Fallback to mock data
      const mockCoinId = this.getMockCoinId(coinId);
      if (mockCoinId && chartData[mockCoinId]) {
        console.log('Using mock data for chart:', coinId);
        return {
          data: chartData[mockCoinId] as ChartData,
          success: true,
        };
      }
      
      return {
        data: { prices: [], market_caps: [], total_volumes: [] },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch top coins by market cap
   */
  async fetchTopCoins(limit: number = 100): Promise<ApiResponse<CoinInfo[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h,7d,30d',
          },
          timeout: 10000,
        }
      );

      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch top coins:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for coins
   */
  async searchCoins(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/search`,
        {
          params: {
            query: query,
          },
          timeout: 10000,
        }
      );

      return {
        data: response.data.coins || [],
        success: true,
      };
    } catch (error) {
      console.error('Failed to search coins:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch single token price
   */
  async fetchTokenPrice(tokenAddress: string): Promise<ApiResponse<number>> {
    try {
      const result = await this.fetchTokenPrices([tokenAddress]);
      
      if (!result.success) {
        return {
          data: 0,
          success: false,
          error: result.error,
        };
      }

      const price = result.data[tokenAddress]?.usd || 0;
      
      return {
        data: price,
        success: true,
      };
    } catch (error) {
      return {
        data: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format token address for CoinGecko API
   */
  private formatAddressForCoingecko(address: string): string {
    // Handle native tokens
    const nativeTokenMap: Record<string, string> = {
      '0x0000000000000000000000000000000000000000': 'bitcoin',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
      'So11111111111111111111111111111111111111112': 'solana',
      // Add more native token mappings as needed
    };

    if (nativeTokenMap[address]) {
      return nativeTokenMap[address];
    }

    // For ERC-20 tokens, use the contract address
    if (address.startsWith('0x')) {
      return `ethereum:${address}`;
    }

    // For Solana tokens, use the mint address
    return `solana:${address}`;
  }

  /**
   * Get original address from CoinGecko coin ID
   */
  private getOriginalAddress(coinId: string, originalAddresses: string[]): string | null {
    // Handle direct matches
    if (originalAddresses.includes(coinId)) {
      return coinId;
    }

    // Handle native tokens
    const nativeTokenMap: Record<string, string> = {
      'bitcoin': '0x0000000000000000000000000000000000000000',
      'ethereum': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      'solana': 'So11111111111111111111111111111111111111112',
    };

    if (nativeTokenMap[coinId]) {
      return nativeTokenMap[coinId];
    }

    // Handle prefixed addresses
    if (coinId.startsWith('ethereum:')) {
      const address = coinId.replace('ethereum:', '');
      return originalAddresses.find(addr => addr.toLowerCase() === address.toLowerCase()) || null;
    }

    if (coinId.startsWith('solana:')) {
      const address = coinId.replace('solana:', '');
      return originalAddresses.find(addr => addr === address) || null;
    }

    return null;
  }

  /**
   * Get trending tokens
   */
  async fetchTrendingTokens(): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/search/trending`, {
        timeout: 10000,
      });

      return {
        data: response.data.coins || [],
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get mock coin ID from real coin ID
   */
  private getMockCoinId(coinId: string): string | null {
    // Map common coin IDs to mock data keys
    const coinIdMap: Record<string, string> = {
      'bitcoin': 'bitcoin',
      'btc': 'bitcoin',
      'ethereum': 'ethereum',
      'eth': 'ethereum',
      'usd-coin': 'usd-coin',
      'usdc': 'usd-coin',
      'tether': 'tether',
      'usdt': 'tether',
      'binancecoin': 'binancecoin',
      'bnb': 'binancecoin',
    };

    return coinIdMap[coinId.toLowerCase()] || null;
  }
}

export const priceService = new PriceService();