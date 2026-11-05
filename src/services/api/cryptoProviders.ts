import axios, { AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '../../constants';
import { PriceData } from '../../types';
import { CoinInfo, ChartData, SparklineData } from './marketTypes';
import { MarketRateLimiter, marketRateLimiter } from './marketRateLimiter';

export const REQUEST_TIMEOUT_MS = 8000;

/** CoinGecko ids that differ from CoinCap asset ids. */
const COINGECKO_TO_COINCAP: Record<string, string> = {
  'wrapped-bitcoin': 'bitcoin', // approximate; CoinCap has no separate WBTC asset in free list
  'usd-coin': 'usd-coin',
  binancecoin: 'binance-coin',
  'matic-network': 'polygon',
  'avalanche-2': 'avalanche',
  'shiba-inu': 'shiba-inu',
  'bitcoin-cash': 'bitcoin-cash',
  'band-protocol': 'band-protocol',
};

const COIN_IMAGE_BY_ID: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  'binance-coin': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  binancecoin: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  tether: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  'usd-coin': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  ripple: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
};

export type ProviderName = 'coingecko' | 'coincap';

export class ProviderError extends Error {
  status?: number;
  retryAfterMs?: number;
  isTimeout: boolean;
  provider: ProviderName;

  constructor(
    message: string,
    opts: {
      status?: number;
      retryAfterMs?: number;
      isTimeout?: boolean;
      provider: ProviderName;
    }
  ) {
    super(message);
    this.name = 'ProviderError';
    this.status = opts.status;
    this.retryAfterMs = opts.retryAfterMs;
    this.isTimeout = opts.isTimeout ?? false;
    this.provider = opts.provider;
  }
}

export function shouldFailover(error: unknown): boolean {
  if (error instanceof ProviderError) {
    if (error.isTimeout) return true;
    if (error.status === 429) return true;
    if (error.status != null && error.status >= 500) return true;
    if (error.status == null) return true;
    return false;
  }
  const anyErr = error as { code?: string; message?: string; response?: { status?: number } };
  if (anyErr?.code === 'ECONNABORTED' || /timeout/i.test(anyErr?.message || '')) return true;
  const status = anyErr?.response?.status;
  if (status === 429 || (status != null && status >= 500)) return true;
  if (status == null) return true;
  return false;
}

function toProviderError(error: unknown, provider: ProviderName): ProviderError {
  if (error instanceof ProviderError) return error;
  const anyErr = error as {
    code?: string;
    message?: string;
    response?: { status?: number; headers?: Record<string, string> };
  };
  const status = anyErr?.response?.status;
  const retryAfterHeader =
    anyErr?.response?.headers?.['retry-after'] ?? anyErr?.response?.headers?.['Retry-After'];
  const isTimeout =
    anyErr?.code === 'ECONNABORTED' || /timeout/i.test(anyErr?.message || '');

  return new ProviderError(anyErr?.message || 'Provider request failed', {
    status,
    retryAfterMs: MarketRateLimiter.parseRetryAfter(retryAfterHeader),
    isTimeout,
    provider,
  });
}

async function httpGet<T>(
  url: string,
  provider: ProviderName,
  config?: AxiosRequestConfig,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  try {
    const response = await axios.get<T>(url, {
      ...config,
      timeout: timeoutMs,
    });
    return response.data;
  } catch (error) {
    const providerError = toProviderError(error, provider);
    if (providerError.status === 429) {
      marketRateLimiter.notifyRateLimited(providerError.retryAfterMs);
    }
    throw providerError;
  }
}

function emptyCoinInfo(): CoinInfo {
  return {
    id: '',
    symbol: '',
    name: '',
    image: '',
    current_price: 0,
    market_cap: 0,
    market_cap_rank: 0,
    total_volume: 0,
    high_24h: 0,
    low_24h: 0,
    price_change_24h: 0,
    price_change_percentage_24h: 0,
    market_cap_change_24h: 0,
    market_cap_change_percentage_24h: 0,
    circulating_supply: 0,
    total_supply: 0,
    max_supply: 0,
    ath: 0,
    ath_change_percentage: 0,
    ath_date: '',
    atl: 0,
    atl_change_percentage: 0,
    atl_date: '',
    last_updated: new Date().toISOString(),
  };
}

function toCoinCapId(coinGeckoId: string): string {
  return COINGECKO_TO_COINCAP[coinGeckoId] || coinGeckoId;
}

/** Map CoinCap asset id back to the CoinGecko-style id the app already uses. */
function toAppCoinId(coinCapId: string, geckoHint?: string): string {
  if (geckoHint) return geckoHint;
  const reverse = Object.entries(COINGECKO_TO_COINCAP).find(([, v]) => v === coinCapId);
  if (reverse) return reverse[0];
  if (coinCapId === 'binance-coin') return 'binancecoin';
  return coinCapId;
}

function normalizeCoinCapAsset(asset: any, geckoIdHint?: string): CoinInfo {
  const price = Number(asset?.priceUsd) || 0;
  const changePct = Number(asset?.changePercent24Hr) || 0;
  const appId = toAppCoinId(String(asset?.id || ''), geckoIdHint);

  return {
    ...emptyCoinInfo(),
    id: appId,
    symbol: String(asset?.symbol || '').toLowerCase(),
    name: String(asset?.name || appId),
    image: COIN_IMAGE_BY_ID[appId] || COIN_IMAGE_BY_ID[String(asset?.id || '')] || '',
    current_price: price,
    market_cap: Number(asset?.marketCapUsd) || 0,
    market_cap_rank: Number(asset?.rank) || 0,
    total_volume: Number(asset?.volumeUsd24Hr) || 0,
    price_change_24h: price * (changePct / 100),
    price_change_percentage_24h: changePct,
    market_cap_change_percentage_24h: changePct,
    circulating_supply: Number(asset?.supply) || 0,
    total_supply: Number(asset?.supply) || 0,
    max_supply: Number(asset?.maxSupply) || 0,
    last_updated: new Date().toISOString(),
  };
}

// ─── CoinGecko (primary) ─────────────────────────────────────────────────────

export async function coingeckoFetchSimplePrices(ids: string[]): Promise<PriceData> {
  const data = await httpGet<Record<string, any>>(
    `${API_ENDPOINTS.COINGECKO}/simple/price`,
    'coingecko',
    {
      params: {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true,
      },
    }
  );

  const priceData: PriceData = {};
  Object.keys(data || {}).forEach((coinId) => {
    const coinData = data[coinId];
    priceData[coinId] = {
      usd: coinData.usd,
      usd_24h_change: coinData.usd_24h_change,
      usd_24h_vol: coinData.usd_24h_vol,
      usd_market_cap: coinData.usd_market_cap,
      last_updated_at: Date.now(),
    };
  });
  return priceData;
}

export async function coingeckoFetchMarkets(
  limit: number,
  page: number
): Promise<CoinInfo[]> {
  return httpGet<CoinInfo[]>(`${API_ENDPOINTS.COINGECKO}/coins/markets`, 'coingecko', {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit,
      page,
      sparkline: false,
      locale: 'en',
    },
  });
}

export async function coingeckoFetchMarketsByIds(ids: string[]): Promise<CoinInfo[]> {
  return httpGet<CoinInfo[]>(`${API_ENDPOINTS.COINGECKO}/coins/markets`, 'coingecko', {
    params: {
      vs_currency: 'usd',
      ids: ids.join(','),
      order: 'market_cap_desc',
      per_page: ids.length,
      page: 1,
      sparkline: false,
      price_change_percentage: '24h',
      locale: 'en',
    },
  });
}

export async function coingeckoFetchTrending(): Promise<any[]> {
  const data = await httpGet<{ coins: any[] }>(
    `${API_ENDPOINTS.COINGECKO}/search/trending`,
    'coingecko'
  );
  return data?.coins || [];
}

export async function coingeckoFetchCoinInfo(coinId: string): Promise<CoinInfo> {
  const markets = await coingeckoFetchMarketsByIds([coinId]);
  if (markets?.[0]) {
    return markets[0];
  }
  throw new ProviderError(`Coin not found: ${coinId}`, { status: 404, provider: 'coingecko' });
}

export async function coingeckoFetchMarketChart(
  coinId: string,
  days: number
): Promise<ChartData> {
  return httpGet<ChartData>(
    `${API_ENDPOINTS.COINGECKO}/coins/${coinId}/market_chart`,
    'coingecko',
    {
      params: {
        vs_currency: 'usd',
        days,
      },
    }
  );
}

// ─── CoinCap (secondary free fallback) ───────────────────────────────────────

export async function coincapFetchSimplePrices(ids: string[]): Promise<PriceData> {
  const priceData: PriceData = {};

  await Promise.all(
    ids.map(async (geckoId) => {
      const capId = toCoinCapId(geckoId);
      try {
        const body = await httpGet<{ data: any }>(
          `${API_ENDPOINTS.COINCAP}/assets/${capId}`,
          'coincap'
        );
        const asset = body?.data;
        if (!asset) return;
        priceData[geckoId] = {
          usd: Number(asset.priceUsd) || 0,
          usd_24h_change: Number(asset.changePercent24Hr) || 0,
          usd_24h_vol: Number(asset.volumeUsd24Hr) || 0,
          usd_market_cap: Number(asset.marketCapUsd) || 0,
          last_updated_at: Date.now(),
        };
      } catch {
        // Skip individual failures; partial data is fine
      }
    })
  );

  return priceData;
}

export async function coincapFetchMarkets(
  limit: number,
  page: number
): Promise<CoinInfo[]> {
  const offset = Math.max(0, (page - 1) * limit);
  const body = await httpGet<{ data: any[] }>(`${API_ENDPOINTS.COINCAP}/assets`, 'coincap', {
    params: {
      limit,
      offset,
    },
  });
  return (body?.data || []).map((asset) => normalizeCoinCapAsset(asset));
}

export async function coincapFetchMarketsByIds(ids: string[]): Promise<CoinInfo[]> {
  const results: CoinInfo[] = [];
  await Promise.all(
    ids.map(async (geckoId) => {
      const capId = toCoinCapId(geckoId);
      try {
        const body = await httpGet<{ data: any }>(
          `${API_ENDPOINTS.COINCAP}/assets/${capId}`,
          'coincap'
        );
        if (body?.data) {
          results.push(normalizeCoinCapAsset(body.data, geckoId));
        }
      } catch {
        // skip
      }
    })
  );
  return results.sort((a, b) => (a.market_cap_rank || 0) - (b.market_cap_rank || 0));
}

export async function coincapFetchTrending(): Promise<any[]> {
  // CoinCap has no trending endpoint — use top assets by market cap as a stand-in
  const markets = await coincapFetchMarkets(15, 1);
  return markets.map((coin) => ({
    item: {
      id: coin.id,
      coin_id: coin.market_cap_rank,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      thumb: coin.image,
      small: coin.image,
      large: coin.image,
      score: 0,
    },
  }));
}

export async function coincapFetchCoinInfo(coinId: string): Promise<CoinInfo> {
  const capId = toCoinCapId(coinId);
  const body = await httpGet<{ data: any }>(
    `${API_ENDPOINTS.COINCAP}/assets/${capId}`,
    'coincap'
  );
  if (!body?.data) {
    throw new ProviderError(`Coin not found: ${coinId}`, { status: 404, provider: 'coincap' });
  }
  return normalizeCoinCapAsset(body.data, coinId);
}

export async function coincapFetchMarketChart(
  coinId: string,
  days: number
): Promise<ChartData> {
  const capId = toCoinCapId(coinId);
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  let interval = 'h1';
  if (days <= 1) interval = 'm15';
  else if (days <= 7) interval = 'h1';
  else if (days <= 30) interval = 'h6';
  else interval = 'd1';

  const body = await httpGet<{ data: any[] }>(
    `${API_ENDPOINTS.COINCAP}/assets/${capId}/history`,
    'coincap',
    {
      params: {
        interval,
        start,
        end,
      },
    }
  );

  const prices: [number, number][] = (body?.data || []).map((point) => [
    Number(point.time) || Date.now(),
    Number(point.priceUsd) || 0,
  ]);

  return {
    prices,
    market_caps: [],
    total_volumes: [],
  };
}

export function sparklineFromChart(chart: ChartData): SparklineData {
  return {
    prices: (chart.prices || []).map((p) => p[1]),
    price_change_percentage_24h: 0,
  };
}

/**
 * Run primary, then secondary on timeout / 429 / 5xx / network failure.
 * Quiet log when fallback succeeds so UI stays seamless.
 */
export async function withProviderFailover<T>(
  label: string,
  primary: () => Promise<T>,
  secondary: () => Promise<T>
): Promise<{ data: T; provider: ProviderName }> {
  try {
    const data = await primary();
    return { data, provider: 'coingecko' };
  } catch (primaryError) {
    if (!shouldFailover(primaryError)) {
      throw primaryError;
    }
    try {
      const data = await secondary();
      console.log(`[market] ${label}: primary failed, using coincap fallback`);
      return { data, provider: 'coincap' };
    } catch {
      console.warn(`[market] ${label}: both providers failed`);
      throw primaryError;
    }
  }
}
