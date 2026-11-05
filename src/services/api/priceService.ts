import { ApiResponse, PriceData } from '../../types';
import { marketRateLimiter } from './marketRateLimiter';
import {
  ChartData,
  ChartDataPoint,
  CoinInfo,
  SparklineData,
} from './marketTypes';
import {
  coingeckoFetchCoinInfo,
  coingeckoFetchMarketChart,
  coingeckoFetchMarkets,
  coingeckoFetchMarketsByIds,
  coingeckoFetchSimplePrices,
  coingeckoFetchTrending,
  coinpaprikaFetchCoinInfo,
  coinpaprikaFetchMarketChart,
  coinpaprikaFetchMarkets,
  coinpaprikaFetchMarketsByIds,
  coinpaprikaFetchSimplePrices,
  coinpaprikaFetchTrending,
  sparklineFromChart,
  withProviderFailover,
} from './cryptoProviders';

export type { CoinInfo, ChartData, ChartDataPoint, SparklineData };

class PriceService {
  /**
   * Rate-limited request with in-flight coalescing by key.
   * All outbound market calls go through this so Home / Search / refresh
   * cannot stampede the free APIs.
   */
  private schedule<T>(key: string, run: () => Promise<T>): Promise<T> {
    return marketRateLimiter.schedule(key, run);
  }

  /**
   * Fetch token prices (CoinGecko → Coinpaprika on timeout/429/5xx).
   */
  async fetchTokenPrices(tokenAddresses: string[]): Promise<ApiResponse<PriceData>> {
    try {
      if (tokenAddresses.length === 0) {
        return { data: {}, success: true };
      }

      const formattedIds = tokenAddresses
        .map((address) => this.formatAddressForCoingecko(address))
        .filter((id): id is string => Boolean(id));

      const uniqueIds = Array.from(new Set(formattedIds));
      if (!uniqueIds.length) {
        return { data: {}, success: true };
      }

      const key = `prices:${uniqueIds.slice().sort().join(',')}`;
      const { data } = await this.schedule(key, () =>
        withProviderFailover(
          'fetchTokenPrices',
          () => coingeckoFetchSimplePrices(uniqueIds),
          () => coinpaprikaFetchSimplePrices(uniqueIds)
        )
      );

      return { data, success: true };
    } catch (error: any) {
      console.error('Error fetching token prices:', error);
      return { data: {}, success: false, error: error.message };
    }
  }

  /**
   * Fetch trending tokens
   */
  async fetchTrendingTokens(): Promise<ApiResponse<any[]>> {
    try {
      const { data } = await this.schedule('trending', () =>
        withProviderFailover(
          'fetchTrendingTokens',
          () => coingeckoFetchTrending(),
          () => coinpaprikaFetchTrending()
        )
      );
      return { data, success: true };
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
      const { data } = await this.schedule(`sparkline:${coinId}:${days}`, () =>
        withProviderFailover(
          `fetchSparklineData:${coinId}`,
          async () => sparklineFromChart(await coingeckoFetchMarketChart(coinId, days)),
          async () => sparklineFromChart(await coinpaprikaFetchMarketChart(coinId, days))
        )
      );
      return { data, success: true };
    } catch (error: any) {
      console.error('Error fetching sparkline data:', error);
      return {
        data: { prices: [], price_change_percentage_24h: 0 },
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch detailed chart data for a token with timestamps
   */
  async fetchChartData(coinId: string, days: number = 30): Promise<ApiResponse<ChartData>> {
    try {
      const { data } = await this.schedule(`chart:${coinId}:${days}`, () =>
        withProviderFailover(
          `fetchChartData:${coinId}`,
          () => coingeckoFetchMarketChart(coinId, days),
          () => coinpaprikaFetchMarketChart(coinId, days)
        )
      );
      return { data, success: true };
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
      return {
        data: { prices: [], market_caps: [], total_volumes: [] },
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch coin info for detailed token data
   */
  async fetchCoinInfo(coinId: string): Promise<ApiResponse<CoinInfo>> {
    try {
      const { data } = await this.schedule(`coin:${coinId}`, () =>
        withProviderFailover(
          `fetchCoinInfo:${coinId}`,
          () => coingeckoFetchCoinInfo(coinId),
          () => coinpaprikaFetchCoinInfo(coinId)
        )
      );
      return { data, success: true };
    } catch (error: any) {
      console.error('Error fetching coin info:', error);
      return {
        data: {} as CoinInfo,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch top coins by market cap with pagination
   */
  async fetchTopCoins(limit: number = 100, page: number = 1): Promise<ApiResponse<CoinInfo[]>> {
    try {
      const { data } = await this.schedule(`markets:${limit}:${page}`, () =>
        withProviderFailover(
          'fetchTopCoins',
          () => coingeckoFetchMarkets(limit, page),
          () => coinpaprikaFetchMarkets(limit, page)
        )
      );
      return { data, success: true };
    } catch (error: any) {
      console.error('Failed to fetch top coins:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch top coins',
      };
    }
  }

  /**
   * Fetch market data for specific coin IDs
   */
  async fetchMarketDataByIds(ids: string[]): Promise<ApiResponse<CoinInfo[]>> {
    if (!ids.length) {
      return { data: [], success: true };
    }

    try {
      const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
      if (!uniqueIds.length) {
        return { data: [], success: true };
      }

      const key = `marketsByIds:${uniqueIds.slice().sort().join(',')}`;
      const { data } = await this.schedule(key, () =>
        withProviderFailover(
          'fetchMarketDataByIds',
          () => coingeckoFetchMarketsByIds(uniqueIds),
          () => coinpaprikaFetchMarketsByIds(uniqueIds)
        )
      );

      return { data, success: true };
    } catch (error: any) {
      console.error('Failed to fetch market data by IDs:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch market data by IDs',
      };
    }
  }

  /**
   * Fetch market data (alias for fetchTopCoins) — used by HomeScreen
   */
  async fetchMarketData(limit: number = 20, page: number = 1): Promise<ApiResponse<CoinInfo[]>> {
    return this.fetchTopCoins(limit, page);
  }

  /**
   * Convert Ethereum address to CoinGecko format
   */
  private formatAddressForCoingecko(address: string): string | null {
    const addressMap: { [key: string]: string } = {
      '0x0000000000000000000000000000000000000000': 'ethereum',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wrapped-bitcoin',
      '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91': 'usd-coin',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether',
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 'binancecoin',
    };

    const lowerMap: { [key: string]: string } = {};
    Object.entries(addressMap).forEach(([k, v]) => {
      lowerMap[k.toLowerCase()] = v;
    });
    return lowerMap[address.toLowerCase()] || null;
  }

  /**
   * Get token price by address (offline mock fallback)
   */
  getTokenPrice(address: string): number {
    const coinId = this.formatAddressForCoingecko(address);
    if (!coinId) return 0;

    const mockPrices: { [key: string]: number } = {
      ethereum: 3200.0,
      'wrapped-bitcoin': 51200.0,
      'usd-coin': 1.0,
      tether: 1.0,
      binancecoin: 312.0,
    };

    return mockPrices[coinId] || 0;
  }

  /**
   * Get token price change by address (offline mock fallback)
   */
  getTokenPriceChange(address: string): number {
    const coinId = this.formatAddressForCoingecko(address);
    if (!coinId) return 0;

    const mockPriceChanges: { [key: string]: number } = {
      ethereum: 2.5,
      'wrapped-bitcoin': 1.8,
      'usd-coin': 0.0,
      tether: 0.0,
      binancecoin: -0.5,
    };

    return mockPriceChanges[coinId] || 0;
  }
}

export const priceService = new PriceService();
