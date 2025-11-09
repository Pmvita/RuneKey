import axios from 'axios';
export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  exchange?: string;
}

export interface StockNewsItem {
  symbol: string;
  title: string;
  url: string;
  publishedAt: string;
  site: string;
  image?: string;
  text?: string;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency?: string;
  price?: number;
  changePercent?: number;
}

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = 'demo'; // Replace with a secure key for production use

const FALLBACK_TRENDING: TrendingStock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.23,
    changePercent: 1.24,
    volume: 51234567,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 328.71,
    changePercent: -0.52,
    volume: 29876543,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 472.55,
    changePercent: 3.12,
    volume: 45678123,
    exchange: 'NASDAQ',
  },
];

const FALLBACK_NEWS: StockNewsItem[] = [
  {
    symbol: 'AAPL',
    title: 'Apple unveils next-gen Mac lineup with AI acceleration',
    url: 'https://finance.example.com/news/apple-next-gen',
    publishedAt: new Date().toISOString(),
    site: 'Finance Example',
    text: 'Apple introduced new silicon with enhanced AI features aimed at pro users.',
  },
  {
    symbol: 'NVDA',
    title: 'NVIDIA posts record data center revenue',
    url: 'https://finance.example.com/news/nvidia-data-center',
    publishedAt: new Date().toISOString(),
    site: 'Finance Example',
    text: 'Demand for GPUs powering AI workloads continues to boost NVIDIA earnings.',
  },
];

const FALLBACK_TOP_GAINERS: TrendingStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.23, changePercent: 1.24, volume: 51234567, exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 472.55, changePercent: 3.12, volume: 45678123, exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 312.44, changePercent: 2.68, volume: 29811223, exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 268.92, changePercent: 4.75, volume: 60233451, exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', price: 124.83, changePercent: 3.91, volume: 40111223, exchange: 'NASDAQ' },
  { symbol: 'SHOP', name: 'Shopify Inc.', price: 68.44, changePercent: 5.32, volume: 18876543, exchange: 'NYSE' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', price: 49.78, changePercent: 2.97, volume: 33456789, exchange: 'NYSE' },
  { symbol: 'ASML', name: 'ASML Holding NV', price: 688.55, changePercent: 1.89, volume: 5123456, exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 396.21, changePercent: 2.41, volume: 17890345, exchange: 'NASDAQ' },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 528.12, changePercent: 1.72, volume: 9423456, exchange: 'NASDAQ' },
];

const FALLBACK_TOP_LOSERS: TrendingStock[] = [
  { symbol: 'INTC', name: 'Intel Corporation', price: 32.14, changePercent: -2.35, volume: 44322112, exchange: 'NASDAQ' },
  { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', price: 78.55, changePercent: -3.82, volume: 28900344, exchange: 'NYSE' },
  { symbol: 'DIS', name: 'The Walt Disney Company', price: 83.21, changePercent: -1.94, volume: 22110987, exchange: 'NYSE' },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: 198.76, changePercent: -2.67, volume: 14566789, exchange: 'NYSE' },
  { symbol: 'BA', name: 'The Boeing Company', price: 184.33, changePercent: -4.12, volume: 17654322, exchange: 'NYSE' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', price: 58.44, changePercent: -3.51, volume: 19877654, exchange: 'NASDAQ' },
  { symbol: 'SQ', name: 'Block Inc.', price: 52.17, changePercent: -2.98, volume: 15500234, exchange: 'NYSE' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', price: 89.65, changePercent: -5.43, volume: 11234567, exchange: 'NASDAQ' },
  { symbol: 'LYFT', name: 'Lyft Inc.', price: 9.34, changePercent: -4.27, volume: 3211098, exchange: 'NASDAQ' },
  { symbol: 'PENN', name: 'PENN Entertainment Inc.', price: 24.78, changePercent: -3.12, volume: 4567732, exchange: 'NASDAQ' },
];

class StocksService {
  private mapMarketMover(item: any): TrendingStock {
    return {
      symbol: item.symbol || item.ticker || '',
      name: item.name || item.companyName || item.symbol || 'Unknown',
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      changePercent:
        typeof item.changesPercentage === 'number'
          ? item.changesPercentage
          : Number(
              String(item.changesPercentage ?? '0')
                .replace('(', '')
                .replace(')', '')
                .replace('%', '')
            ) || 0,
      volume:
        typeof item.volume === 'number'
          ? item.volume
          : Number(item.volume) || 0,
      exchange: item.exchange || item.stockExchange,
    };
  }

  async fetchTrending(): Promise<TrendingStock[]> {
    try {
      const url = `${FMP_BASE}/stock_market/gainers?apikey=${FMP_API_KEY}`;
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        return FALLBACK_TRENDING;
      }

      return data.slice(0, 12).map((item: any) => this.mapMarketMover(item));
    } catch (error) {
      console.warn('stocksService.fetchTrending: using fallback data', error);
      return FALLBACK_TRENDING;
    }
  }

  async fetchTopGainers(limit: number = 50): Promise<TrendingStock[]> {
    try {
      const url = `${FMP_BASE}/stock_market/gainers?apikey=${FMP_API_KEY}`;
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        return FALLBACK_TOP_GAINERS.slice(0, limit);
      }

      return data.slice(0, limit).map((item: any) => this.mapMarketMover(item));
    } catch (error) {
      console.warn('stocksService.fetchTopGainers: using fallback data', error);
      return FALLBACK_TOP_GAINERS.slice(0, limit);
    }
  }

  async fetchTopLosers(limit: number = 50): Promise<TrendingStock[]> {
    try {
      const url = `${FMP_BASE}/stock_market/losers?apikey=${FMP_API_KEY}`;
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        return FALLBACK_TOP_LOSERS.slice(0, limit);
      }

      return data.slice(0, limit).map((item: any) => this.mapMarketMover(item));
    } catch (error) {
      console.warn('stocksService.fetchTopLosers: using fallback data', error);
      return FALLBACK_TOP_LOSERS.slice(0, limit);
    }
  }

  async fetchNews(limit: number = 15): Promise<StockNewsItem[]> {
    try {
      const url = `${FMP_BASE}/stock_news?limit=${limit}&apikey=${FMP_API_KEY}`;
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        return FALLBACK_NEWS;
      }

      return data.map((item: any) => ({
        symbol: item.symbol || item.ticker || '',
        title: item.title || 'Market update',
        url: item.url,
        publishedAt: item.publishedDate || item.date || new Date().toISOString(),
        site: item.site || item.source || 'Finance',
        image: item.image,
        text: item.text,
      }));
    } catch (error) {
      console.warn('stocksService.fetchNews: using fallback data', error);
      return FALLBACK_NEWS;
    }
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    if (!query) {
      return [];
    }

    try {
      const url = `${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : [];

      return data.map((item: any) => ({
        symbol: (item.symbol || item.ticker || '').toUpperCase(),
        name: item.name || item.companyName || item.symbol || 'Unknown',
        exchange: item.exchangeShortName || item.exchange || 'MARKET',
        currency: item.currency,
        price: typeof item.price === 'number' ? item.price : Number(item.price),
      }));
    } catch (error) {
      console.warn('stocksService.searchSymbols: using fallback search data', error);
      return [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSEARCA' },
      ];
    }
  }

  /**
   * Placeholder for future brokerage integration.
   * Currently returns a resolved promise to simulate execution.
   */
  async simulateOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
  }): Promise<{ success: boolean; reference: string }> {
    console.log('Simulated stock order', params);
    return Promise.resolve({
      success: true,
      reference: `SIM-${Date.now()}`,
    });
  }
}

export const stocksService = new StocksService();

