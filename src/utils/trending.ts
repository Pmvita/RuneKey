import { CoinInfo } from '../services/api/priceService';

export interface NormalizedTrendingToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank?: number;
}

const parseNumeric = (value: any, defaultValue = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
};

export const mapTrendingResponse = (
  data: any[],
  fallbackStartIndex = 0
): NormalizedTrendingToken[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry, index) => {
    const item = entry?.item ?? entry ?? {};
    const stats = item.data ?? {};
    const rank =
      typeof item.market_cap_rank === 'number'
        ? item.market_cap_rank
        : typeof item.score === 'number'
        ? item.score + 1
        : undefined;

    const price =
      parseNumeric(stats.price) ??
      parseNumeric(stats.price_usd) ??
      parseNumeric(item.current_price);

    const priceChange =
      parseNumeric(stats.price_change_percentage_24h?.usd) ??
      parseNumeric(stats.price_change_percentage_24h) ??
      parseNumeric(item.price_change_percentage_24h);

    const rawSymbol = (item.symbol ?? '').toString().toUpperCase();
    const fallbackSymbolSource = (item.id ?? item.slug ?? `token-${fallbackStartIndex + index + 1}`).toString();
    const fallbackSymbol = fallbackSymbolSource
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase();
    const symbol = rawSymbol || fallbackSymbol || `TK${fallbackStartIndex + index + 1}`;

    return {
      id: item.id ?? `token-${fallbackStartIndex + index}`,
      symbol,
      name: (item.name ?? item.slug ?? symbol) || `Token ${fallbackStartIndex + index + 1}`,
      image: item.large ?? item.thumb ?? item.image ?? '',
      current_price: price ?? 0,
      price_change_percentage_24h: priceChange ?? 0,
      market_cap_rank: rank,
    };
  });
};

export const createFallbackTrendingTokens = (): NormalizedTrendingToken[] => [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 110000,
    price_change_percentage_24h: 2.5,
    market_cap_rank: 1,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 4300,
    price_change_percentage_24h: -1.2,
    market_cap_rank: 2,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 200,
    price_change_percentage_24h: 5.8,
    market_cap_rank: 7,
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    current_price: 0.5,
    price_change_percentage_24h: 3.2,
    market_cap_rank: 8,
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    current_price: 8.5,
    price_change_percentage_24h: -0.8,
    market_cap_rank: 12,
  },
  {
    id: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    current_price: 1.5,
    price_change_percentage_24h: 4.1,
    market_cap_rank: 14,
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    current_price: 18.75,
    price_change_percentage_24h: 6.4,
    market_cap_rank: 23,
  },
];

export const mergeCoinInfoWithTrending = (
  trending: NormalizedTrendingToken[],
  coinInfo: CoinInfo[] = []
): NormalizedTrendingToken[] => {
  if (!coinInfo.length) {
    return trending;
  }

  const infoMap = new Map(coinInfo.map((coin) => [coin.id, coin]));

  return trending.map((token) => {
    const info = infoMap.get(token.id);
    if (!info) {
      return token;
    }

    return {
      ...token,
      current_price: Number.isFinite(info.current_price) ? info.current_price : token.current_price,
      price_change_percentage_24h: Number.isFinite(info.price_change_percentage_24h)
        ? info.price_change_percentage_24h
        : token.price_change_percentage_24h,
      market_cap_rank: info.market_cap_rank ?? token.market_cap_rank,
    };
  });
};

