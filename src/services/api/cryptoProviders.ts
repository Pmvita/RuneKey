import axios, { AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '../../constants';
import { PriceData } from '../../types';
import { CoinInfo, ChartData, SparklineData } from './marketTypes';
import { MarketRateLimiter, marketRateLimiter } from './marketRateLimiter';

export const REQUEST_TIMEOUT_MS = 8000;

/** Common CoinGecko id → Coinpaprika id. */
const COINGECKO_TO_COINPAPRIKA: Record<string, string> = {
  bitcoin: 'btc-bitcoin',
  ethereum: 'eth-ethereum',
  'wrapped-bitcoin': 'wbtc-wrapped-bitcoin',
  'usd-coin': 'usdc-usd-coin',
  tether: 'usdt-tether',
  binancecoin: 'bnb-binance-coin',
  solana: 'sol-solana',
  cardano: 'ada-cardano',
  ripple: 'xrp-xrp',
  dogecoin: 'doge-dogecoin',
  polkadot: 'dot-polkadot',
  'matic-network': 'matic-polygon',
  'avalanche-2': 'avax-avalanche',
  chainlink: 'link-chainlink',
  uniswap: 'uni-uniswap',
  'shiba-inu': 'shib-shiba-inu',
  litecoin: 'ltc-litecoin',
  cosmos: 'atom-cosmos',
  near: 'near-near-protocol',
  tron: 'trx-tron',
  'bitcoin-cash': 'bch-bitcoin-cash',
  stellar: 'xlm-stellar',
  aptos: 'apt-aptos',
  sui: 'sui-sui',
  optimism: 'op-optimism',
  arbitrum: 'arb-arbitrum',
  'band-protocol': 'band-band-protocol',
};

const COIN_IMAGE_BY_GECKO_ID: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  binancecoin: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  tether: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  'usd-coin': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  'wrapped-bitcoin': 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  ripple: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
};

export type ProviderName = 'coingecko' | 'coinpaprika';

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

function toCoinpaprikaId(coinGeckoId: string): string | null {
  return COINGECKO_TO_COINPAPRIKA[coinGeckoId] || null;
}

function geckoIdFromPaprika(ticker: any, hint?: string): string {
  if (hint) return hint;
  const found = Object.entries(COINGECKO_TO_COINPAPRIKA).find(([, v]) => v === ticker?.id);
  if (found) return found[0];
  // "btc-bitcoin" → "bitcoin"
  const parts = String(ticker?.id || '').split('-');
  return parts.length > 1 ? parts.slice(1).join('-') : String(ticker?.id || '');
}

function normalizeCoinpaprikaTicker(ticker: any, geckoIdHint?: string): CoinInfo {
  const usd = ticker?.quotes?.USD || {};
  const geckoId = geckoIdFromPaprika(ticker, geckoIdHint);
  const price = Number(usd.price) || 0;
  const changePct = Number(usd.percent_change_24h) || 0;

  return {
    ...emptyCoinInfo(),
    id: geckoId,
    symbol: String(ticker?.symbol || '').toLowerCase(),
    name: String(ticker?.name || geckoId),
    image: COIN_IMAGE_BY_GECKO_ID[geckoId] || '',
    current_price: price,
    market_cap: Number(usd.market_cap) || 0,
    market_cap_rank: Number(ticker?.rank) || 0,
    total_volume: Number(usd.volume_24h) || 0,
    price_change_24h: price * (changePct / 100),
    price_change_percentage_24h: changePct,
    market_cap_change_percentage_24h: changePct,
    circulating_supply: Number(ticker?.circulating_supply) || 0,
    total_supply: Number(ticker?.total_supply) || 0,
    max_supply: Number(ticker?.max_supply) || 0,
    ath: Number(usd.ath_price) || 0,
    ath_change_percentage: Number(usd.percent_from_price_ath) || 0,
    ath_date: usd.ath_date || '',
    last_updated: ticker?.last_updated || new Date().toISOString(),
  };
}

function daysToCoinpaprikaInterval(days: number): { start: string; interval: string } {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (days <= 7) return { start, interval: '1h' };
  if (days <= 30) return { start, interval: '6h' };
  return { start, interval: '1d' };
}

/** Cached top tickers for Coinpaprika market pagination (avoids re-downloading mid-session). */
let paprikaTickersCache: { at: number; data: any[] } | null = null;
const PAPRIKA_TICKERS_TTL_MS = 60_000;

async function getCoinpaprikaTickers(): Promise<any[]> {
  if (paprikaTickersCache && Date.now() - paprikaTickersCache.at < PAPRIKA_TICKERS_TTL_MS) {
    return paprikaTickersCache.data;
  }
  const tickers = await httpGet<any[]>(
    `${API_ENDPOINTS.COINPAPRIKA}/tickers`,
    'coinpaprika',
    { params: { quotes: 'USD' } }
  );
  paprikaTickersCache = { at: Date.now(), data: tickers || [] };
  return paprikaTickersCache.data;
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

// ─── Coinpaprika (secondary free fallback) ───────────────────────────────────

export async function coinpaprikaFetchSimplePrices(ids: string[]): Promise<PriceData> {
  const priceData: PriceData = {};

  await Promise.all(
    ids.map(async (geckoId) => {
      const paprikaId = toCoinpaprikaId(geckoId);
      if (!paprikaId) return;
      try {
        const ticker = await httpGet<any>(
          `${API_ENDPOINTS.COINPAPRIKA}/tickers/${paprikaId}`,
          'coinpaprika',
          { params: { quotes: 'USD' } }
        );
        const usd = ticker?.quotes?.USD || {};
        priceData[geckoId] = {
          usd: Number(usd.price) || 0,
          usd_24h_change: Number(usd.percent_change_24h) || 0,
          usd_24h_vol: Number(usd.volume_24h) || 0,
          usd_market_cap: Number(usd.market_cap) || 0,
          last_updated_at: Date.now(),
        };
      } catch {
        // Skip individual failures; partial data is fine
      }
    })
  );

  return priceData;
}

export async function coinpaprikaFetchMarkets(
  limit: number,
  page: number
): Promise<CoinInfo[]> {
  const tickers = await getCoinpaprikaTickers();
  const offset = Math.max(0, (page - 1) * limit);
  return tickers.slice(offset, offset + limit).map((t) => normalizeCoinpaprikaTicker(t));
}

export async function coinpaprikaFetchMarketsByIds(ids: string[]): Promise<CoinInfo[]> {
  const results: CoinInfo[] = [];
  await Promise.all(
    ids.map(async (geckoId) => {
      const paprikaId = toCoinpaprikaId(geckoId);
      if (!paprikaId) return;
      try {
        const ticker = await httpGet<any>(
          `${API_ENDPOINTS.COINPAPRIKA}/tickers/${paprikaId}`,
          'coinpaprika',
          { params: { quotes: 'USD' } }
        );
        results.push(normalizeCoinpaprikaTicker(ticker, geckoId));
      } catch {
        // skip
      }
    })
  );
  return results.sort((a, b) => (a.market_cap_rank || 0) - (b.market_cap_rank || 0));
}

export async function coinpaprikaFetchTrending(): Promise<any[]> {
  const tickers = await getCoinpaprikaTickers();
  const top = tickers
    .slice(0, 50)
    .sort(
      (a, b) =>
        Math.abs(Number(b?.quotes?.USD?.percent_change_24h) || 0) -
        Math.abs(Number(a?.quotes?.USD?.percent_change_24h) || 0)
    )
    .slice(0, 15);

  return top.map((t) => {
    const coin = normalizeCoinpaprikaTicker(t);
    return {
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
    };
  });
}

export async function coinpaprikaFetchCoinInfo(coinId: string): Promise<CoinInfo> {
  const paprikaId = toCoinpaprikaId(coinId);
  if (!paprikaId) {
    throw new ProviderError(`No Coinpaprika mapping for ${coinId}`, {
      status: 404,
      provider: 'coinpaprika',
    });
  }
  const ticker = await httpGet<any>(
    `${API_ENDPOINTS.COINPAPRIKA}/tickers/${paprikaId}`,
    'coinpaprika',
    { params: { quotes: 'USD' } }
  );
  return normalizeCoinpaprikaTicker(ticker, coinId);
}

export async function coinpaprikaFetchMarketChart(
  coinId: string,
  days: number
): Promise<ChartData> {
  const paprikaId = toCoinpaprikaId(coinId);
  if (!paprikaId) {
    throw new ProviderError(`No Coinpaprika mapping for ${coinId}`, {
      status: 404,
      provider: 'coinpaprika',
    });
  }
  const { start, interval } = daysToCoinpaprikaInterval(days);
  const history = await httpGet<any[]>(
    `${API_ENDPOINTS.COINPAPRIKA}/tickers/${paprikaId}/historical`,
    'coinpaprika',
    { params: { start, interval } }
  );

  const prices: [number, number][] = (history || []).map((point) => {
    const ts = Date.parse(point.timestamp || point.time_open || point.time_close) || Date.now();
    const price = Number(point.price) || Number(point.close) || 0;
    return [ts, price];
  });

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
      console.log(`[market] ${label}: primary failed, using coinpaprika fallback`);
      return { data, provider: 'coinpaprika' };
    } catch {
      console.warn(`[market] ${label}: both providers failed`);
      throw primaryError;
    }
  }
}
