import axios from 'axios';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse, Investment } from '../../types';

export interface InvestmentQuote {
  symbol: string;
  price: number;
  changePercent: number;
  currency: string;
  exchange?: string;
  shortName?: string;
}

export interface InvestmentQuotesResponse {
  [symbol: string]: InvestmentQuote;
}

export interface InvestmentChartPoint {
  timestamp: number;
  close: number;
}

export interface InvestmentChartResponse {
  symbol: string;
  currency?: string;
  points: InvestmentChartPoint[];
}

interface ChartParams {
  range?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';
  interval?: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';
  region?: string;
  includePrePost?: boolean;
}

class InvestingService {
  private quotesURL = API_ENDPOINTS.STOOQ_QUOTE;
  private chartURL = API_ENDPOINTS.YAHOO_FINANCE_CHART;
  private yahooQuoteURL = API_ENDPOINTS.YAHOO_FINANCE;

  /**
   * Normalize symbol for Yahoo Finance API
   * Converts dots to hyphens for class shares (e.g., BRK.B -> BRK-B)
   * Preserves caret (^) for index symbols (e.g., ^GSPC)
   */
  private normalizeSymbolForYahoo(symbol: string): string {
    if (!symbol) return symbol;
    // Preserve caret for index symbols (^GSPC, ^DJI, etc.)
    // Convert dots to hyphens for class shares (BRK.B -> BRK-B, BRK.A -> BRK-A)
    return symbol.replace(/\./g, '-').toUpperCase();
  }

  /**
   * Fetch quote from Yahoo Finance API (primary method)
   */
  private async fetchYahooQuote(symbol: string): Promise<InvestmentQuote | null> {
    try {
      const normalizedSymbol = this.normalizeSymbolForYahoo(symbol);
      // URL encode the symbol properly (handles ^, =, etc.)
      const encodedSymbol = encodeURIComponent(normalizedSymbol);
      const url = `${this.yahooQuoteURL}?symbols=${encodedSymbol}`;
      const requestUrl = Platform.OS === 'web' 
        ? `${API_ENDPOINTS.CORS_PROXY}${encodeURIComponent(url)}`
        : url;

      const response = await axios.get(requestUrl);
      const result = response.data?.quoteResponse?.result?.[0];

      if (!result) {
        console.warn(`Yahoo Finance: No result for symbol ${symbol} (normalized: ${normalizedSymbol})`);
        return null;
      }

      // Handle different price fields (indices might use different field names)
      // Try multiple possible price fields
      const price = typeof result.regularMarketPrice === 'number' && result.regularMarketPrice > 0
        ? result.regularMarketPrice 
        : typeof result.price === 'number' && result.price > 0
        ? result.price
        : typeof result.regularMarketPrice === 'string'
        ? parseFloat(result.regularMarketPrice) || 0
        : typeof result.price === 'string'
        ? parseFloat(result.price) || 0
        : 0;
      
      // Handle previous close (for calculating change percent)
      const previousClose = typeof result.regularMarketPreviousClose === 'number' && result.regularMarketPreviousClose > 0
        ? result.regularMarketPreviousClose
        : typeof result.previousClose === 'number' && result.previousClose > 0
        ? result.previousClose
        : typeof result.regularMarketPreviousClose === 'string'
        ? parseFloat(result.regularMarketPreviousClose) || price
        : typeof result.previousClose === 'string'
        ? parseFloat(result.previousClose) || price
        : price;

      const changePercent = previousClose !== 0 && price !== 0
        ? ((price - previousClose) / previousClose) * 100
        : 0;

      // Log if price is still 0 for debugging
      if (price === 0 && symbol.startsWith('^')) {
        console.warn(`Yahoo Finance: Price is 0 for index ${symbol}. Response data:`, JSON.stringify(result, null, 2));
      }

      return {
        symbol: symbol.toUpperCase(),
        price,
        changePercent,
        currency: result.currency || 'USD',
        exchange: result.fullExchangeName || result.exchange || 'MARKET',
        shortName: result.shortName || result.longName || symbol,
      };
    } catch (error: any) {
      console.warn(`Yahoo Finance quote failed for ${symbol}:`, error?.message);
      return null;
    }
  }

  private mapSymbolToStooq(holding: Pick<Investment, 'symbol' | 'type' | 'market'>): string | null {
    const rawSymbol = holding.symbol?.trim();
    if (!rawSymbol) {
      return null;
    }

    const upper = rawSymbol.toUpperCase();

    // Skip index symbols (^GSPC, ^DJI, etc.) - STOOQ doesn't support them
    if (upper.startsWith('^')) {
      return null;
    }

    // Handle forex and commodity pairs that use the =X suffix
    if (upper.includes('=')) {
      return upper.replace('=X', '').toLowerCase();
    }

    // For US equities/ETFs default to .us suffix
    if (holding.market?.toUpperCase().includes('NASDAQ') || holding.market?.toUpperCase().includes('NYSE')) {
      return `${upper.toLowerCase()}.us`;
    }

    // Default fallback: lowercase symbol without modifications
    return upper.toLowerCase();
  }

  private buildUrl(base: string, params: Record<string, string | number | boolean | undefined>): string {
    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    const fullUrl = queryString ? `${base}?${queryString}` : base;
    if (Platform.OS === 'web') {
      return `${API_ENDPOINTS.CORS_PROXY}${encodeURIComponent(fullUrl)}`;
    }
    return fullUrl;
  }

  async fetchQuotes(holdings: Array<Pick<Investment, 'symbol' | 'type' | 'market' | 'currency' | 'name'>>): Promise<ApiResponse<InvestmentQuotesResponse>> {
    if (holdings.length === 0) {
      return { data: {}, success: true };
    }

    const uniqueHoldingsMap = new Map<string, Pick<Investment, 'symbol' | 'type' | 'market' | 'currency' | 'name'>>();
    holdings.forEach((holding) => {
      if (holding?.symbol) {
        uniqueHoldingsMap.set(holding.symbol.toUpperCase(), holding);
      }
    });

    if (uniqueHoldingsMap.size === 0) {
      return { data: {}, success: true };
    }

    const quoteEntries = await Promise.all(
      Array.from(uniqueHoldingsMap.entries()).map(async ([symbol, holding]) => {
        // Try Yahoo Finance first (more reliable, free, no API key needed)
        let quote = await this.fetchYahooQuote(symbol);
        
        // For index symbols (^GSPC, etc.), try fetching from chart API as fallback
        if (!quote || quote.price === 0) {
          if (symbol.startsWith('^')) {
            try {
              const chartResponse = await this.fetchChart(symbol, { range: '1d', interval: '1d' });
              if (chartResponse.success && chartResponse.data.points.length > 0) {
                const latestPoint = chartResponse.data.points[chartResponse.data.points.length - 1];
                const previousPoint = chartResponse.data.points.length > 1 
                  ? chartResponse.data.points[chartResponse.data.points.length - 2]
                  : latestPoint;
                
                const price = latestPoint.close;
                const previousClose = previousPoint.close;
                const changePercent = previousClose !== 0 && price !== 0
                  ? ((price - previousClose) / previousClose) * 100
                  : 0;

                quote = {
                  symbol: symbol.toUpperCase(),
                  price,
                  changePercent,
                  currency: chartResponse.data.currency || holding.currency || 'USD',
                  exchange: holding.market || 'INDEX',
                  shortName: holding.name || symbol,
                };
              }
            } catch (error: any) {
              console.warn(`Chart API fallback failed for index ${symbol}:`, error?.message);
            }
          }
        }
        
        // Fallback to STOOQ if Yahoo Finance fails (skip for indices)
        if (!quote || quote.price === 0) {
          const stooqSymbol = this.mapSymbolToStooq(holding);
          if (stooqSymbol) {
            try {
              const requestUrl = this.buildUrl(this.quotesURL, {
                s: stooqSymbol,
                f: 'sd2t2ohlcv',
                h: '',
                e: 'json',
              });
              const response = await axios.get(requestUrl);

              const entry = response.data?.symbols?.[0];
              const close = typeof entry?.close === 'number' ? entry.close : parseFloat(entry?.close);
              const open = typeof entry?.open === 'number' ? entry.open : parseFloat(entry?.open);

              const price = Number.isFinite(close) ? close : 0;
              let changePercent = 0;
              if (Number.isFinite(open) && open !== 0 && Number.isFinite(price)) {
                changePercent = ((price - open) / open) * 100;
              }

              if (price > 0) {
                quote = {
                  symbol,
                  price,
                  changePercent,
                  currency: holding.currency || 'USD',
                  exchange: holding.market || 'STOOQ',
                  shortName: holding.name || symbol,
                };
              }
            } catch (error: any) {
              console.warn(`STOOQ quote failed for ${symbol}:`, error?.message);
            }
          }
        }

        if (quote && quote.price > 0) {
          return { symbol, quote, success: true };
        }

        return { symbol, quote: null, success: false, error: 'All APIs failed or returned zero price' };
      })
    );

    const quotes: InvestmentQuotesResponse = {};
    let anySuccess = false;

    quoteEntries.forEach(({ symbol, quote, success }) => {
      if (quote) {
        quotes[symbol] = quote;
        anySuccess = true;
      } else if (!success) {
        quotes[symbol] = {
          symbol,
          price: 0,
          changePercent: 0,
          currency: uniqueHoldingsMap.get(symbol)?.currency || 'USD',
          exchange: uniqueHoldingsMap.get(symbol)?.market || 'STOOQ',
          shortName: uniqueHoldingsMap.get(symbol)?.name || symbol,
        };
      }
    });

    return {
      data: quotes,
      success: anySuccess,
      error: anySuccess ? undefined : 'Failed to fetch live quotes',
    };
  }

  async fetchChart(symbol: string, params: ChartParams = {}): Promise<ApiResponse<InvestmentChartResponse>> {
    const sanitizedSymbol = symbol?.trim();

    if (!sanitizedSymbol) {
      return {
        data: {
          symbol: '',
          points: [],
        },
        success: true,
      };
    }

    // Normalize symbol for Yahoo Finance API (convert dots to hyphens)
    const normalizedSymbol = this.normalizeSymbolForYahoo(sanitizedSymbol);

    try {
      const requestUrl = this.buildUrl(
        `${this.chartURL}/${encodeURIComponent(normalizedSymbol)}`,
        {
          range: params.range ?? '1mo',
          interval: params.interval ?? '1d',
          region: params.region ?? 'US',
          includePrePost: params.includePrePost ?? false,
        }
      );
      const response = await axios.get(requestUrl);

      const result = response.data?.chart?.result?.[0];
      const timestamps: number[] = Array.isArray(result?.timestamp) ? result.timestamp : [];
      const candles = result?.indicators?.quote?.[0];
      const closes: Array<number | null> = Array.isArray(candles?.close) ? candles.close : [];
      const currency: string | undefined = result?.meta?.currency;

      const points: InvestmentChartPoint[] = [];

      timestamps.forEach((timestamp, index) => {
        const close = closes[index];
        if (typeof close === 'number' && Number.isFinite(close)) {
          points.push({
            timestamp: timestamp * 1000,
            close,
          });
        }
      });

      return {
        data: {
          symbol: sanitizedSymbol.toUpperCase(),
          currency,
          points,
        },
        success: true,
      };
    } catch (error: any) {
      console.error(`Error fetching chart for ${sanitizedSymbol} (normalized: ${normalizedSymbol}):`, error);
      return {
        data: {
          symbol: sanitizedSymbol.toUpperCase(),
          points: [],
        },
        success: false,
        error: error?.message || 'Failed to fetch chart data',
      };
    }
  }
}

export const investingService = new InvestingService();
