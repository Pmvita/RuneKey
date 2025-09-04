import axios from 'axios';
import { API_ENDPOINTS } from '../../constants';
import { PriceData, ApiResponse } from '../../types';

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

export interface SparklineData {
  prices: number[];
  price_change_percentage_24h: number;
}

class PriceService {
  private baseURL = API_ENDPOINTS.COINGECKO;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1200; // 1.2 seconds between requests (CoinGecko free tier limit)

  /**
   * Rate-limited request handler
   */
  private async makeRateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    try {
      this.lastRequestTime = Date.now();
      return await requestFn();
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited - wait longer and retry
        console.log('⚠️ Rate limited by CoinGecko API, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.lastRequestTime = Date.now();
        return await requestFn();
      }
      throw error;
    }
  }

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

      return await this.makeRateLimitedRequest(async () => {
        const response = await axios.get(
          `${this.baseURL}/simple/price`,
          {
            params: {
              ids: formattedAddresses,
              vs_currencies: 'usd',
              include_24hr_change: true,
              include_24hr_vol: true,
              include_market_cap: true,
            },
          }
        );

        const priceData: PriceData = {};
        Object.keys(response.data).forEach(coinId => {
          const coinData = response.data[coinId];
          priceData[coinId] = {
            usd: coinData.usd,
            usd_24h_change: coinData.usd_24h_change,
            usd_24h_vol: coinData.usd_24h_vol,
            usd_market_cap: coinData.usd_market_cap,
          };
        });

        return { data: priceData, success: true };
      });
    } catch (error: any) {
      console.error('Error fetching token prices:', error);
      return { data: {}, success: false, error: error.message };
    }
  }

  /**
   * Fetch trending tokens from CoinGecko
   */
  async fetchTrendingTokens(): Promise<ApiResponse<any[]>> {
    try {
      return await this.makeRateLimitedRequest(async () => {
        const response = await axios.get(`${this.baseURL}/search/trending`);
        return { data: response.data.coins, success: true };
      });
    } catch (error: any) {
      console.error('Error fetching trending tokens:', error);
      return { data: [], success: false, error: error.message };
    }
  }

  /**
   * Fetch sparkline chart data for a token
   */
  async fetchSparklineData(coinId: string, days: number = 7): Promise<ApiResponse<SparklineData>> {
    try {
      return await this.makeRateLimitedRequest(async () => {
        const response = await axios.get(
          `${this.baseURL}/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: days,
            },
          }
        );

        const prices = response.data.prices.map((price: [number, number]) => price[1]);
        
        return {
          data: {
            prices: prices,
            price_change_percentage_24h: 0, // Will be updated separately
          },
          success: true,
        };
      });
    } catch (error: any) {
      console.error('Error fetching sparkline data:', error);
      return { data: { prices: [], price_change_percentage_24h: 0 }, success: false, error: error.message };
    }
  }

  /**
   * Fetch market data for top coins (for the assets list)
   */
  async fetchMarketData(limit: number = 50): Promise<ApiResponse<CoinInfo[]>> {
    try {
      return await this.makeRateLimitedRequest(async () => {
        const response = await axios.get(
          `${this.baseURL}/coins/markets`,
          {
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: limit,
              page: 1,
              sparkline: true,
              price_change_percentage: '24h',
            },
          }
        );

        return { data: response.data, success: true };
      });
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      return { data: [], success: false, error: error.message };
    }
  }

  /**
   * Convert Ethereum address to CoinGecko format
   */
  private formatAddressForCoingecko(address: string): string | null {
    // Map common token addresses to CoinGecko IDs
    const addressMap: { [key: string]: string } = {
      '0x0000000000000000000000000000000000000000': 'ethereum',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wrapped-bitcoin',
      '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91': 'usd-coin',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether',
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 'binancecoin',
    };

    const lowerAddress = address.toLowerCase();
    return addressMap[lowerAddress] || null;
  }

  /**
   * Get token price by address
   */
  getTokenPrice(address: string): number {
    const coinId = this.formatAddressForCoingecko(address);
    if (!coinId) return 0;
    
    // This would need to be implemented with cached data
    return 0;
  }

  /**
   * Get token price change by address
   */
  getTokenPriceChange(address: string): number {
    const coinId = this.formatAddressForCoingecko(address);
    if (!coinId) return 0;
    
    // This would need to be implemented with cached data
    return 0;
  }
}

export const priceService = new PriceService();