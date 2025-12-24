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
  logoUrl?: string;
  companyName?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
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

// NewsAPI configuration (free tier: 100 requests/day)
const NEWS_API_BASE = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY || '';

// Finnhub for company logos (free tier: 60 calls/minute)
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || 'demo';

// Helper to get company logo URL
const getCompanyLogoUrl = (symbol: string): string => {
  // Use Finnhub logo API or fallback to a logo service
  if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'demo') {
    return `${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  }
  // Fallback: Use a public logo service
  return `https://logo.clearbit.com/${getCompanyDomain(symbol)}.com`;
};

// Map stock symbols to company domains for logo fetching
const getCompanyDomain = (symbol: string): string => {
  const domainMap: Record<string, string> = {
    AAPL: 'apple',
    MSFT: 'microsoft',
    GOOGL: 'google',
    AMZN: 'amazon',
    META: 'meta',
    TSLA: 'tesla',
    NVDA: 'nvidia',
    NFLX: 'netflix',
    AMD: 'amd',
    INTC: 'intel',
    JPM: 'jpmorgan',
    V: 'visa',
    MA: 'mastercard',
    DIS: 'disney',
    CRM: 'salesforce',
    ADBE: 'adobe',
  };
  return domainMap[symbol] || symbol.toLowerCase();
};

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
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 312.44,
    changePercent: 2.68,
    volume: 29811223,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 268.92,
    changePercent: 4.75,
    volume: 60233451,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    price: 124.83,
    changePercent: 3.91,
    volume: 40111223,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.35,
    changePercent: 1.85,
    volume: 35123456,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 152.78,
    changePercent: 2.13,
    volume: 45234567,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 396.21,
    changePercent: 2.41,
    volume: 17890345,
    exchange: 'NASDAQ',
  },
  {
    symbol: 'ADBE',
    name: 'Adobe Inc.',
    price: 528.12,
    changePercent: 1.72,
    volume: 9423456,
    exchange: 'NASDAQ',
  },
];

const FALLBACK_NEWS: StockNewsItem[] = [
  {
    symbol: 'AAPL',
    title: 'Apple unveils next-gen Mac lineup with AI acceleration',
    url: 'https://finance.example.com/news/apple-next-gen',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    site: 'Tech Finance',
    text: 'Apple introduced new silicon with enhanced AI features aimed at pro users.',
  },
  {
    symbol: 'NVDA',
    title: 'NVIDIA posts record data center revenue',
    url: 'https://finance.example.com/news/nvidia-data-center',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    site: 'Market Watch',
    text: 'Demand for GPUs powering AI workloads continues to boost NVIDIA earnings.',
  },
  {
    symbol: 'MSFT',
    title: 'Microsoft announces major Azure expansion',
    url: 'https://finance.example.com/news/microsoft-azure',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    site: 'Business Insider',
    text: 'Microsoft plans to invest billions in expanding its cloud infrastructure.',
  },
  {
    symbol: 'TSLA',
    title: 'Tesla reports strong Q4 delivery numbers',
    url: 'https://finance.example.com/news/tesla-deliveries',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    site: 'Reuters',
    text: 'Tesla delivered more vehicles than expected in the fourth quarter.',
  },
  {
    symbol: 'META',
    title: 'Meta platforms sees growth in ad revenue',
    url: 'https://finance.example.com/news/meta-revenue',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    site: 'Bloomberg',
    text: 'Meta Platforms reports strong advertising revenue growth.',
  },
  {
    symbol: 'GOOGL',
    title: 'Alphabet launches new AI initiatives',
    url: 'https://finance.example.com/news/google-ai',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    site: 'CNBC',
    text: 'Google parent company announces major AI investments.',
  },
  {
    symbol: 'AMZN',
    title: 'Amazon expands same-day delivery network',
    url: 'https://finance.example.com/news/amazon-delivery',
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
    site: 'Wall Street Journal',
    text: 'Amazon continues to expand its same-day delivery capabilities.',
  },
  {
    symbol: 'AMD',
    title: 'AMD gains market share in server processors',
    url: 'https://finance.example.com/news/amd-servers',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    site: 'TechCrunch',
    text: 'AMD continues to gain market share in the server processor market.',
  },
  {
    symbol: 'INTC',
    title: 'Intel announces new manufacturing plans',
    url: 'https://finance.example.com/news/intel-manufacturing',
    publishedAt: new Date(Date.now() - 32400000).toISOString(),
    site: 'Financial Times',
    text: 'Intel reveals plans for new manufacturing facilities.',
  },
  {
    symbol: 'JPM',
    title: 'JPMorgan reports strong quarterly earnings',
    url: 'https://finance.example.com/news/jpmorgan-earnings',
    publishedAt: new Date(Date.now() - 36000000).toISOString(),
    site: 'Forbes',
    text: 'JPMorgan Chase reports better-than-expected quarterly earnings.',
  },
  {
    symbol: 'V',
    title: 'Visa announces new digital payment solutions',
    url: 'https://finance.example.com/news/visa-digital',
    publishedAt: new Date(Date.now() - 39600000).toISOString(),
    site: 'Yahoo Finance',
    text: 'Visa introduces new digital payment technologies.',
  },
  {
    symbol: 'MA',
    title: 'Mastercard partners with fintech startups',
    url: 'https://finance.example.com/news/mastercard-fintech',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
    site: 'Reuters',
    text: 'Mastercard forms partnerships with emerging fintech companies.',
  },
  {
    symbol: 'DIS',
    title: 'Disney reports streaming subscriber growth',
    url: 'https://finance.example.com/news/disney-streaming',
    publishedAt: new Date(Date.now() - 46800000).toISOString(),
    site: 'Variety',
    text: 'Disney+ sees continued subscriber growth in latest quarter.',
  },
  {
    symbol: 'NFLX',
    title: 'Netflix announces new original content slate',
    url: 'https://finance.example.com/news/netflix-content',
    publishedAt: new Date(Date.now() - 50400000).toISOString(),
    site: 'Deadline',
    text: 'Netflix unveils ambitious slate of original programming.',
  },
  {
    symbol: 'CRM',
    title: 'Salesforce introduces new AI tools',
    url: 'https://finance.example.com/news/salesforce-ai',
    publishedAt: new Date(Date.now() - 54000000).toISOString(),
    site: 'TechCrunch',
    text: 'Salesforce launches new AI-powered business tools.',
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

      const mapped = data.slice(0, 15).map((item: any) => this.mapMarketMover(item));
      console.log('📈 Fetched trending stocks from API:', mapped.length);
      return mapped;
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

  /**
   * Fetch company logo URL from Finnhub or Clearbit
   */
  private async fetchCompanyLogo(symbol: string, companyName?: string): Promise<string | undefined> {
    try {
      // Try Finnhub first if API key is available
      if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'demo') {
        const profileUrl = `${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const response = await axios.get(profileUrl, { timeout: 5000 });
        if (response.data?.logo) {
          return response.data.logo;
        }
      }
      
      // Fallback to Clearbit logo service
      const domain = getCompanyDomain(symbol);
      const clearbitUrl = `https://logo.clearbit.com/${domain}.com`;
      
      // Test if logo exists by making a HEAD request
      try {
        const testResponse = await axios.head(clearbitUrl, { timeout: 3000 });
        if (testResponse.status === 200) {
          return clearbitUrl;
        }
      } catch {
        // Logo doesn't exist, return undefined
      }
      
      return undefined;
    } catch (error) {
      console.warn(`Failed to fetch logo for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch news from multiple sources with enhanced data
   */
  async fetchNews(limit: number = 15, page: number = 1): Promise<StockNewsItem[]> {
    const newsItems: StockNewsItem[] = [];
    
    try {
      // Strategy 1: Try NewsAPI (if API key is available)
      if (NEWS_API_KEY && NEWS_API_KEY !== '') {
        try {
          const newsApiUrl = `${NEWS_API_BASE}/everything?q=stock+market+OR+finance+OR+investing&sortBy=publishedAt&pageSize=${limit}&page=${page}&apiKey=${NEWS_API_KEY}`;
          const newsApiResponse = await axios.get(newsApiUrl, { timeout: 8000 });
          
          if (newsApiResponse.data?.articles?.length > 0) {
            const articles = newsApiResponse.data.articles;
            
            // Process articles and extract symbols from titles
            for (const article of articles) {
              const symbol = this.extractSymbolFromTitle(article.title || '');
              const logoUrl = symbol ? await this.fetchCompanyLogo(symbol) : undefined;
              
              newsItems.push({
                symbol: symbol || 'MARKET',
                title: article.title || 'Market update',
                url: article.url || '',
                publishedAt: article.publishedAt || new Date().toISOString(),
                site: article.source?.name || 'News',
                image: article.urlToImage,
                text: article.description,
                logoUrl,
                companyName: symbol ? this.getCompanyName(symbol) : undefined,
                sentiment: this.analyzeSentiment(article.title || ''),
              });
              
              if (newsItems.length >= limit) break;
            }
            
            if (newsItems.length > 0) {
              console.log(`📰 Fetched ${newsItems.length} news items from NewsAPI`);
              return newsItems;
            }
          }
        } catch (newsApiError) {
          console.warn('NewsAPI fetch failed, trying alternatives:', newsApiError);
        }
      }

      // Strategy 2: Try Financial Modeling Prep API
      try {
        const url = `${FMP_BASE}/stock_news?limit=${limit}&apikey=${FMP_API_KEY}`;
        const response = await axios.get(url, { timeout: 8000 });
        const data = Array.isArray(response.data) ? response.data : [];

        if (data.length > 0) {
          // Fetch logos for all symbols in parallel
          const logoPromises = data.map((item: any) => {
            const symbol = item.symbol || item.ticker || '';
            return this.fetchCompanyLogo(symbol).then(logoUrl => ({ symbol, logoUrl }));
          });
          
          const logoResults = await Promise.all(logoPromises);
          const logoMap = new Map(logoResults.map(r => [r.symbol, r.logoUrl]));

          const mappedNews = data.map((item: any) => {
            const symbol = item.symbol || item.ticker || '';
            return {
              symbol,
              title: item.title || 'Market update',
              url: item.url || '',
              publishedAt: item.publishedDate || item.date || new Date().toISOString(),
              site: item.site || item.source || 'Finance',
              image: item.image,
              text: item.text,
              logoUrl: logoMap.get(symbol),
              companyName: this.getCompanyName(symbol),
              sentiment: this.analyzeSentiment(item.title || ''),
            };
          });

          console.log(`📰 Fetched ${mappedNews.length} news items from FMP`);
          return mappedNews;
        }
      } catch (fmpError) {
        console.warn('FMP API fetch failed, using fallback:', fmpError);
      }

      // Strategy 3: Use enhanced fallback data with logos
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = FALLBACK_NEWS.slice(startIndex, endIndex);
      
      // Fetch logos for fallback news
      const fallbackWithLogos = await Promise.all(
        paginatedNews.map(async (news) => {
          const logoUrl = await this.fetchCompanyLogo(news.symbol);
          return {
            ...news,
            logoUrl,
            companyName: this.getCompanyName(news.symbol),
            sentiment: this.analyzeSentiment(news.title),
          };
        })
      );
      
      if (fallbackWithLogos.length === 0 && page === 1) {
        // Return all fallback news if first page is empty
        const allFallback = FALLBACK_NEWS.slice(0, limit);
        return await Promise.all(
          allFallback.map(async (news) => {
            const logoUrl = await this.fetchCompanyLogo(news.symbol);
            return {
              ...news,
              logoUrl,
              companyName: this.getCompanyName(news.symbol),
              sentiment: this.analyzeSentiment(news.title),
            };
          })
        );
      }
      
      return fallbackWithLogos;
    } catch (error) {
      console.warn('stocksService.fetchNews: using fallback data', error);
      
      // Final fallback with logos
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNews = FALLBACK_NEWS.slice(startIndex, endIndex);
      
      const fallbackWithLogos = await Promise.all(
        paginatedNews.map(async (news) => {
          const logoUrl = await this.fetchCompanyLogo(news.symbol);
          return {
            ...news,
            logoUrl,
            companyName: this.getCompanyName(news.symbol),
            sentiment: this.analyzeSentiment(news.title),
          };
        })
      );
      
      if (fallbackWithLogos.length === 0 && page === 1) {
        const allFallback = FALLBACK_NEWS.slice(0, limit);
        return await Promise.all(
          allFallback.map(async (news) => {
            const logoUrl = await this.fetchCompanyLogo(news.symbol);
            return {
              ...news,
              logoUrl,
              companyName: this.getCompanyName(news.symbol),
              sentiment: this.analyzeSentiment(news.title),
            };
          })
        );
      }
      
      return fallbackWithLogos;
    }
  }

  /**
   * Extract stock symbol from news title
   */
  private extractSymbolFromTitle(title: string): string {
    // Common stock symbols in titles (e.g., "Apple (AAPL) announces...")
    const symbolPattern = /\(([A-Z]{1,5})\)/;
    const match = title.match(symbolPattern);
    if (match && match[1]) {
      return match[1];
    }
    
    // Check for common company names
    const companyMap: Record<string, string> = {
      'apple': 'AAPL',
      'microsoft': 'MSFT',
      'google': 'GOOGL',
      'alphabet': 'GOOGL',
      'amazon': 'AMZN',
      'meta': 'META',
      'facebook': 'META',
      'tesla': 'TSLA',
      'nvidia': 'NVDA',
      'netflix': 'NFLX',
      'amd': 'AMD',
      'intel': 'INTC',
      'jpmorgan': 'JPM',
      'visa': 'V',
      'mastercard': 'MA',
      'disney': 'DIS',
      'salesforce': 'CRM',
      'adobe': 'ADBE',
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [company, symbol] of Object.entries(companyMap)) {
      if (lowerTitle.includes(company)) {
        return symbol;
      }
    }
    
    return '';
  }

  /**
   * Get company name from symbol
   */
  private getCompanyName(symbol: string): string | undefined {
    const nameMap: Record<string, string> = {
      AAPL: 'Apple Inc.',
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.',
      META: 'Meta Platforms Inc.',
      TSLA: 'Tesla Inc.',
      NVDA: 'NVIDIA Corporation',
      NFLX: 'Netflix Inc.',
      AMD: 'Advanced Micro Devices Inc.',
      INTC: 'Intel Corporation',
      JPM: 'JPMorgan Chase & Co.',
      V: 'Visa Inc.',
      MA: 'Mastercard Inc.',
      DIS: 'The Walt Disney Company',
      CRM: 'Salesforce Inc.',
      ADBE: 'Adobe Inc.',
    };
    return nameMap[symbol];
  }

  /**
   * Simple sentiment analysis based on keywords
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['gain', 'rise', 'surge', 'jump', 'soar', 'up', 'growth', 'profit', 'success', 'breakthrough', 'record', 'beat'];
    const negativeWords = ['fall', 'drop', 'plunge', 'crash', 'down', 'loss', 'decline', 'miss', 'warn', 'concern', 'risk', 'fail'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
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

