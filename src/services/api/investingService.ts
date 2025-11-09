import axios from 'axios';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

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

class InvestingService {
  private baseURL = API_ENDPOINTS.YAHOO_FINANCE;

  async fetchQuotes(symbols: string[]): Promise<ApiResponse<InvestmentQuotesResponse>> {
    if (symbols.length === 0) {
      return { data: {}, success: true };
    }

    try {
      const querySymbols = Array.from(new Set(symbols.map((sym) => sym.trim()).filter(Boolean))).join(',');

      if (!querySymbols) {
        return { data: {}, success: true };
      }

      const response = await axios.get(this.baseURL, {
        params: {
          symbols: querySymbols,
        },
      });

      const results = response.data?.quoteResponse?.result ?? [];
      const quotes: InvestmentQuotesResponse = {};

      results.forEach((item: any) => {
        const symbol = item.symbol?.toUpperCase();
        if (!symbol) {
          return;
        }

        quotes[symbol] = {
          symbol,
          price: typeof item.regularMarketPrice === 'number' ? item.regularMarketPrice : 0,
          changePercent: typeof item.regularMarketChangePercent === 'number' ? item.regularMarketChangePercent : 0,
          currency: item.currency || 'USD',
          exchange: item.fullExchangeName || item.exchange,
          shortName: item.shortName || item.longName,
        };
      });

      return {
        data: quotes,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching investing quotes:', error);
      return {
        data: {},
        success: false,
        error: error?.message || 'Failed to fetch quotes',
      };
    }
  }
}

export const investingService = new InvestingService();
