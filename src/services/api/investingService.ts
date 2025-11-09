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

  private mapSymbolToStooq(holding: Pick<Investment, 'symbol' | 'type' | 'market'>): string | null {
    const rawSymbol = holding.symbol?.trim();
    if (!rawSymbol) {
      return null;
    }

    const upper = rawSymbol.toUpperCase();

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
        const stooqSymbol = this.mapSymbolToStooq(holding);
        if (!stooqSymbol) {
          return { symbol, quote: null, success: false };
        }

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

          const quote: InvestmentQuote = {
            symbol,
            price,
            changePercent,
            currency: holding.currency || 'USD',
            exchange: holding.market || 'STOOQ',
            shortName: holding.name || symbol,
          };

          return { symbol, quote, success: true };
        } catch (error: any) {
          console.error(`Error fetching quote for ${symbol}:`, error?.message || error);
          return { symbol, quote: null, success: false, error };
        }
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

    try {
      const requestUrl = this.buildUrl(
        `${this.chartURL}/${encodeURIComponent(sanitizedSymbol)}`,
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
      console.error(`Error fetching chart for ${sanitizedSymbol}:`, error);
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
