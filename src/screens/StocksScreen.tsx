import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import investingData from '../../mockData/investing.json';
import { Investment, InvestmentHolding } from '../types';
import { investingService } from '../services/api/investingService';
import { formatLargeCurrency } from '../utils/formatters';
import {
  SelectionHighlightOverlay,
  SparklineChart,
  TabSelector,
  UniversalBackground,
  useSelectionHighlight,
} from '../components';
import {
  stocksService,
  StockNewsItem,
  SymbolSearchResult,
  TrendingStock,
} from '../services/api/stocksService';

const investments: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

const DEFAULT_RANGE = '1mo';
const TOP_MOVERS_PAGE_SIZE = 10;

const buildTradingViewHtml = (symbol: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <style>
      html, body, #chart-container {
        margin: 0;
        padding: 0;
        background: #020617;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="chart-container"></div>
    <script type="text/javascript">
      new TradingView.widget({
        autosize: true,
        symbol: "${symbol}",
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "3",
        locale: "en",
        enable_publishing: false,
        hide_top_toolbar: false,
        allow_symbol_change: false,
        container_id: "chart-container",
        calendar: true,
        studies: ["RSI@tv-basicstudies"],
        drawings_access: { type: 'full', tools: ['Trend Line', 'Horizontal Line', 'Fib Retracement'] }
      });
    </script>
  </body>
</html>
`;

export const StocksScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'watchlist' | 'chart'>('overview');
  const [holdings, setHoldings] = useState<InvestmentHolding[]>(() =>
    investments.map((investment) => ({
      ...investment,
      currentPrice: 0,
      changePercent: 0,
      marketValue: 0,
    }))
  );
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [featuredChart, setFeaturedChart] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [newsItems, setNewsItems] = useState<StockNewsItem[]>([]);
  const [topGainers, setTopGainers] = useState<TrendingStock[]>([]);
  const [topLosers, setTopLosers] = useState<TrendingStock[]>([]);
  const [gainersPage, setGainersPage] = useState(0);
  const [losersPage, setLosersPage] = useState(0);
  const [isLoadingTopMovers, setIsLoadingTopMovers] = useState(false);
  const [topMoversTab, setTopMoversTab] = useState<'gainers' | 'losers'>('gainers');
  const { setHighlight } = useSelectionHighlight();
  const lastHighlightedSymbolRef = useRef<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<InvestmentHolding | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQuantity, setTradeQuantity] = useState<string>('1');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [featuredOverride, setFeaturedOverride] = useState<
    (Partial<InvestmentHolding> & { symbol: string }) | null
  >(null);
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  const [chartSearchResults, setChartSearchResults] = useState<SymbolSearchResult[]>([]);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);

  const resolvedActiveSymbol = useMemo(() => activeSymbol ?? holdings[0]?.symbol ?? 'AAPL', [
    activeSymbol,
    holdings,
  ]);

  const featuredInstrument = useMemo(() => {
    const symbol = resolvedActiveSymbol?.toUpperCase();
    if (!symbol) {
      return null;
    }

    const baseHolding =
      holdings.find((holding) => holding.symbol === symbol) ??
      (featuredOverride?.symbol === symbol
        ? ({
            id: symbol,
            symbol,
            name: featuredOverride?.name ?? symbol,
            market: featuredOverride?.market ?? 'MARKET',
            quantity: featuredOverride?.quantity ?? 0,
            averagePrice:
              featuredOverride?.averagePrice ?? featuredOverride?.currentPrice ?? 0,
            currentPrice: featuredOverride?.currentPrice ?? 0,
            changePercent: featuredOverride?.changePercent ?? 0,
            marketValue:
              (featuredOverride?.quantity ?? 0) *
              (featuredOverride?.currentPrice ?? 0),
          } as InvestmentHolding)
        : null);

    if (!baseHolding) {
      return null;
    }

    if (featuredOverride?.symbol === symbol) {
      return {
        ...baseHolding,
        ...featuredOverride,
        marketValue:
          (featuredOverride.quantity ?? baseHolding.quantity) *
          (featuredOverride.currentPrice ?? baseHolding.currentPrice),
      };
    }

    return baseHolding;
  }, [featuredOverride, holdings, resolvedActiveSymbol]);

  const loadQuotes = useCallback(async () => {
    if (investments.length === 0) {
      setHoldings([]);
      return;
    }

    const response = await investingService.fetchQuotes(investments);
    const quotes = response.data || {};

    setHoldings((previous) =>
      investments
        .map((investment) => {
          const symbol = investment.symbol.toUpperCase();
          const quote = quotes[symbol];
          const currentPrice =
            typeof quote?.price === 'number' && Number.isFinite(quote.price)
              ? quote.price
              : previous.find((h) => h.id === investment.id)?.currentPrice ?? 0;
          const changePercent =
            typeof quote?.changePercent === 'number' && Number.isFinite(quote.changePercent)
              ? quote.changePercent
              : previous.find((h) => h.id === investment.id)?.changePercent ?? 0;
          const marketValue = (investment.quantity || 0) * currentPrice;

          return {
            ...investment,
            currentPrice,
            changePercent,
            marketValue,
          };
        })
        .sort((a, b) => b.marketValue - a.marketValue)
    );
  }, []);

  const loadFeaturedChart = useCallback(
    async (symbol: string, overrides?: Partial<InvestmentHolding>) => {
      if (!symbol) {
        setFeaturedChart([]);
        return;
      }

      setIsChartLoading(true);
      setChartError(null);
      try {
        const response = await investingService.fetchChart(symbol, {
          range: DEFAULT_RANGE,
          interval: '1d',
        });

        if (!response.success) {
          setChartError(response.error || 'Unable to load chart data.');
          setFeaturedChart([]);
          return;
        }

        const closes = response.data.points.map((point) => point.close);
        setFeaturedChart(closes);

        if (overrides && symbol.toUpperCase() === resolvedActiveSymbol.toUpperCase()) {
          setFeaturedOverride((prev) => ({
            symbol: symbol.toUpperCase(),
            ...prev,
            ...overrides,
          }));
        }
      } catch (error: any) {
        setChartError(error?.message || 'Unable to load chart data.');
        setFeaturedChart([]);
      } finally {
        setIsChartLoading(false);
      }
    },
    []
  );

  const loadMarketExtras = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const [trending, news] = await Promise.all([
        stocksService.fetchTrending(),
        stocksService.fetchNews(15),
      ]);
      setTrendingStocks(trending);
      setNewsItems(news);
    } catch (error) {
      console.warn('StocksScreen: failed to fetch market extras', error);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  const loadTopMovers = useCallback(async () => {
    setIsLoadingTopMovers(true);
    try {
      const [gainers, losers] = await Promise.all([
        stocksService.fetchTopGainers(50),
        stocksService.fetchTopLosers(50),
      ]);
      setTopGainers(gainers);
      setTopLosers(losers);
      setGainersPage(0);
      setLosersPage(0);
      setTopMoversTab('gainers');
    } catch (error) {
      console.warn('StocksScreen: failed to fetch top movers', error);
    } finally {
      setIsLoadingTopMovers(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadQuotes(), loadMarketExtras(), loadTopMovers()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadQuotes, loadMarketExtras, loadTopMovers]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [loadQuotes])
  );

  useEffect(() => {
    if (featuredInstrument) {
      loadFeaturedChart(featuredInstrument.symbol, {
        currentPrice: featuredInstrument.currentPrice,
        changePercent: featuredInstrument.changePercent,
        name: featuredInstrument.name,
        market: featuredInstrument.market,
      });
    }
  }, [featuredInstrument?.symbol, loadFeaturedChart]);

  useEffect(() => {
    if (!activeSymbol && holdings.length > 0) {
      setActiveSymbol(holdings[0].symbol);
    }
  }, [activeSymbol, holdings]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (chartSearchQuery.trim().length >= 2) {
      timeout = setTimeout(async () => {
        setIsSearchingSymbols(true);
        const results = await stocksService.searchSymbols(chartSearchQuery.trim());
        setChartSearchResults(results);
        setIsSearchingSymbols(false);
      }, 400);
    } else {
      setChartSearchResults([]);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [chartSearchQuery]);

  useEffect(() => {
    loadMarketExtras();
    loadTopMovers();
  }, [loadMarketExtras, loadTopMovers]);

  useFocusEffect(
    useCallback(() => {
      loadMarketExtras();
      loadTopMovers();
    }, [loadMarketExtras, loadTopMovers])
  );

  const gainersMaxPage = Math.max(
    Math.ceil(topGainers.length / TOP_MOVERS_PAGE_SIZE) - 1,
    0
  );
  const losersMaxPage = Math.max(
    Math.ceil(topLosers.length / TOP_MOVERS_PAGE_SIZE) - 1,
    0
  );
  const visibleGainers = topGainers.slice(
    gainersPage * TOP_MOVERS_PAGE_SIZE,
    gainersPage * TOP_MOVERS_PAGE_SIZE + TOP_MOVERS_PAGE_SIZE
  );
  const visibleLosers = topLosers.slice(
    losersPage * TOP_MOVERS_PAGE_SIZE,
    losersPage * TOP_MOVERS_PAGE_SIZE + TOP_MOVERS_PAGE_SIZE
  );
  const emitHighlight = useCallback(
    (symbol: string | null) => {
      if (!symbol) return;
      const upper = symbol.toUpperCase();
      lastHighlightedSymbolRef.current = upper;
      setHighlight(`stocks:${upper}`);
    },
    [setHighlight]
  );

  useEffect(() => {
    const upper = resolvedActiveSymbol?.toUpperCase();
    if (upper && lastHighlightedSymbolRef.current !== upper) {
      emitHighlight(upper);
    }
  }, [emitHighlight, resolvedActiveSymbol]);

  const openTradeModal = (holding: InvestmentHolding, side: 'buy' | 'sell') => {
    setSelectedHolding(holding);
    setTradeType(side);
    setTradeQuantity('1');
    setTradeModalVisible(true);
    setActiveSymbol(holding.symbol);
    emitHighlight(holding.symbol);
  };

  const handleConfirmTrade = async () => {
    if (!selectedHolding) return;

    const quantityNumber = Number(tradeQuantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      return;
    }

    setIsSubmittingTrade(true);
    try {
      await stocksService.simulateOrder({
        symbol: selectedHolding.symbol,
        side: tradeType,
        quantity: quantityNumber,
        price: selectedHolding.currentPrice,
      });

      setHoldings((prev) =>
        prev
          .map((holding) => {
            if (holding.id !== selectedHolding.id) return holding;

            const newQuantity =
              tradeType === 'buy'
                ? holding.quantity + quantityNumber
                : Math.max(0, holding.quantity - quantityNumber);

            const updatedAveragePrice =
              tradeType === 'buy' && newQuantity > 0
                ? (holding.averagePrice * holding.quantity +
                    quantityNumber * holding.currentPrice) /
                  newQuantity
                : holding.averagePrice;

            return {
              ...holding,
              quantity: newQuantity,
              averagePrice: updatedAveragePrice,
              marketValue: newQuantity * holding.currentPrice,
            };
          })
          .sort((a, b) => b.marketValue - a.marketValue)
      );
    } finally {
      setIsSubmittingTrade(false);
      setTradeModalVisible(false);
    }
  };

  const getLogoUri = (symbol: string) =>
    `https://financialmodelingprep.com/image-stock/${symbol?.toUpperCase()}.png`;

  const renderHolding = ({ item }: { item: InvestmentHolding }) => {
    const isPositive = item.changePercent >= 0;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(30, 41, 59, 0.6)',
          padding: 18,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
              {item.symbol} • {item.market}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              {formatLargeCurrency(item.marketValue)}
            </Text>
            <Text
              style={{
                color: isPositive ? '#34D399' : '#F87171',
                fontSize: 13,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              {isPositive ? '+' : ''}
              {item.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last Price</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginTop: 4 }}>
              {formatLargeCurrency(item.currentPrice)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>Quantity</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginTop: 4 }}>
              {item.quantity.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openTradeModal(item, 'buy')}
            style={{
              flex: 1,
              marginRight: 8,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(59, 130, 246, 0.16)',
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.35)',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 13 }}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openTradeModal(item, 'sell')}
            style={{
              flex: 1,
              marginLeft: 8,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(248, 113, 113, 0.16)',
              borderWidth: 1,
              borderColor: 'rgba(248, 113, 113, 0.45)',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#F87171', fontWeight: '600', fontSize: 13 }}>Sell</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 6 }}>
            Markets
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>
            Live equity, ETF, forex & commodity signals
          </Text>

          <TabSelector
            options={[
              { key: 'overview', label: 'Overview' },
              { key: 'watchlist', label: 'Watchlist' },
              { key: 'chart', label: 'Chart' },
            ]}
            selectedKey={activeTab}
            onSelect={(key) => setActiveTab(key as 'overview' | 'watchlist' | 'chart')}
            style={{ marginBottom: 24 }}
          />
        </View>

        {activeTab === 'overview' ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshAll}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={refreshAll}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Ionicons name="refresh" size={16} color="#3B82F6" />
              <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                Refresh data
              </Text>
            </TouchableOpacity>

          {featuredInstrument && (
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.7)',
                padding: 20,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75 }}>
                    FEATURED
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 8 }}>
                    {featuredInstrument.name}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                    {featuredInstrument.symbol} • {featuredInstrument.market}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
                    {formatLargeCurrency(featuredInstrument.currentPrice)}
                  </Text>
                  <Text
                    style={{
                      color: featuredInstrument.changePercent >= 0 ? '#34D399' : '#F87171',
                      fontSize: 14,
                      fontWeight: '600',
                      marginTop: 6,
                    }}
                  >
                    {featuredInstrument.changePercent >= 0 ? '+' : ''}
                    {featuredInstrument.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 160,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isChartLoading ? (
                  <ActivityIndicator color="#3B82F6" />
                ) : chartError ? (
                  <Text style={{ color: '#F87171', fontSize: 12 }}>{chartError}</Text>
                ) : featuredChart.length > 1 ? (
                  <SparklineChart
                    data={featuredChart}
                    width={Math.min(320, featuredChart.length * 12)}
                    height={140}
                    color={featuredInstrument.changePercent >= 0 ? '#34D399' : '#F87171'}
                    strokeWidth={3}
                  />
                ) : (
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Chart data unavailable</Text>
                )}
              </View>
            </View>
          )}

          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Trending</Text>
              <TouchableOpacity onPress={loadMarketExtras} activeOpacity={0.8}>
                <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingStocks.length === 0 && isLoadingTrending ? (
                <View
                  style={{
                    width: 120,
                    height: 140,
                    borderRadius: 20,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(30, 41, 59, 0.6)',
                  }}
                >
                  <ActivityIndicator color="#3B82F6" />
                </View>
              ) : (
                trendingStocks.map((stock) => {
                  const positive = stock.changePercent >= 0;
                  const symbol = stock.symbol.toUpperCase();
                  return (
                    <View key={stock.symbol} style={{ position: 'relative' }}>
                      <SelectionHighlightOverlay
                        highlightKey={`stocks:${symbol}`}
                        color="#3B82F6"
                        borderRadius={20}
                        style={{ top: -4, left: -4, right: -4, bottom: -4, borderWidth: 2 }}
                      />
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={{
                          width: 140,
                          marginRight: 12,
                          padding: 16,
                          borderRadius: 20,
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          borderWidth: 1,
                          borderColor: 'rgba(30, 41, 59, 0.6)',
                        }}
                        onPress={() => {
                          setActiveSymbol(symbol);
                          setFeaturedOverride({
                            symbol,
                            name: stock.name,
                            market: stock.exchange ?? 'MARKET',
                            currentPrice: stock.price,
                            changePercent: stock.changePercent,
                          });
                          emitHighlight(symbol);
                        }}
                      >
                        <Image
                          source={{ uri: getLogoUri(stock.symbol) }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            alignSelf: 'center',
                            marginBottom: 12,
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          }}
                        />
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                          {stock.symbol}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                          {stock.name.length > 18 ? `${stock.name.slice(0, 15)}…` : stock.name}
                        </Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
                          {formatLargeCurrency(stock.price)}
                        </Text>
                        <Text
                          style={{
                            color: positive ? '#34D399' : '#F87171',
                            fontSize: 12,
                            fontWeight: '600',
                            marginTop: 4,
                            textAlign: 'center',
                          }}
                        >
                          {positive ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={{ marginTop: 32 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              Market News
            </Text>
            {newsItems.map((news) => (
              <TouchableOpacity
                key={`${news.symbol}-${news.url}`}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(news.url).catch(() => {})}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(30, 41, 59, 0.55)',
                  padding: 18,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>
                      {news.symbol || 'MARKET'}
                    </Text>
                  </View>
                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
                    {news.site}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 11, marginLeft: 6 }}>
                    • {new Date(news.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
                  {news.title}
                </Text>
                {news.text ? (
                  <Text style={{ color: '#94A3B8', fontSize: 13 }} numberOfLines={3}>
                    {news.text}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
          </ScrollView>
        ) : activeTab === 'watchlist' ? (
          <FlatList
            data={holdings}
            keyExtractor={(item) => item.id}
            renderItem={renderHolding}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={refreshAll}
            ListHeaderComponent={
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 16 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Watchlist</Text>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>AUTO-SYNCED</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 14 }}>No holdings available.</Text>
              </View>
            }
          />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.55)',
                padding: 20,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75 }}>
                ACTIVE SYMBOL
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 8 }}>
                {featuredInstrument?.symbol ?? resolvedActiveSymbol}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                {featuredInstrument?.name ?? 'Search for a symbol to begin charting'}
              </Text>
              {featuredInstrument ? (
                <>
                  <View
                    style={{
                      marginTop: 20,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <View>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Last Price</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 4 }}>
                        {formatLargeCurrency(featuredInstrument.currentPrice)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>Change</Text>
                      <Text
                        style={{
                          color: featuredInstrument.changePercent >= 0 ? '#34D399' : '#F87171',
                          fontSize: 16,
                          fontWeight: '700',
                          marginTop: 4,
                        }}
                      >
                        {featuredInstrument.changePercent >= 0 ? '+' : ''}
                        {featuredInstrument.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 20,
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      borderWidth: 1,
                      borderColor: 'rgba(30, 41, 59, 0.5)',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ color: '#64748B', fontSize: 11 }}>Market Value</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                        {formatLargeCurrency(featuredInstrument.marketValue ?? 0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={{ color: '#64748B', fontSize: 11 }}>Quantity</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                        {Number.isFinite(featuredInstrument.quantity)
                          ? (featuredInstrument.quantity ?? 0).toLocaleString()
                          : '—'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12, alignItems: 'flex-end' }}>
                      <Text style={{ color: '#64748B', fontSize: 11 }}>Avg Price</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                        {formatLargeCurrency(featuredInstrument.averagePrice ?? featuredInstrument.currentPrice)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            <View
              style={{
                height: 460,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.55)',
                backgroundColor: '#020617',
                marginBottom: 16,
              }}
            >
              <WebView
                key={resolvedActiveSymbol}
                source={{ html: buildTradingViewHtml(resolvedActiveSymbol) }}
                style={{ flex: 1, backgroundColor: '#020617' }}
                originWhitelist={['*']}
                javaScriptEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#3B82F6" />
                  </View>
                )}
              />
            </View>

            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.6)',
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === 'ios' ? 16 : 10,
              }}
            >
              <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Search symbol</Text>
              <TextInput
                value={chartSearchQuery}
                onChangeText={setChartSearchQuery}
                placeholder="e.g. NVDA, TSLA, GBPUSD"
                placeholderTextColor="#475569"
                autoCapitalize="characters"
                style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}
              />
              {isSearchingSymbols && (
                <View style={{ paddingVertical: 8 }}>
                  <ActivityIndicator color="#3B82F6" size="small" />
                </View>
              )}
              {chartSearchResults.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  {chartSearchResults.slice(0, 6).map((result) => (
                    <TouchableOpacity
                      key={`${result.symbol}-${result.exchange}`}
                      activeOpacity={0.85}
                      onPress={() => {
                        const nextSymbol = result.symbol.toUpperCase();
                        setActiveSymbol(nextSymbol);
                        setFeaturedOverride({
                          symbol: nextSymbol,
                          name: result.name,
                          market: result.exchange,
                          currentPrice: result.price ?? featuredInstrument?.currentPrice ?? 0,
                          changePercent: result.changePercent ?? featuredInstrument?.changePercent ?? 0,
                        });
                        emitHighlight(nextSymbol);
                        setChartSearchQuery('');
                        setChartSearchResults([]);
                      }}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderColor: 'rgba(30, 41, 59, 0.65)',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                        {result.symbol}
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                        {result.name} • {result.exchange}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View
              style={{
                marginTop: 20,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.6)',
                padding: 16,
              }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Top Movers</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                  Explore the biggest winners and losers across the market
                </Text>
              </View>

              {isLoadingTopMovers ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color="#3B82F6" />
                </View>
              ) : (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <TabSelector
                      options={[
                        { key: 'gainers', label: 'Top Gainers' },
                        { key: 'losers', label: 'Top Losers' },
                      ]}
                      selectedKey={topMoversTab}
                      onSelect={(key) => {
                        const nextKey = key as 'gainers' | 'losers';
                        setTopMoversTab(nextKey);
                        if (nextKey === 'gainers') {
                          setGainersPage(0);
                        } else {
                          setLosersPage(0);
                        }
                      }}
                      style={{ marginBottom: 0 }}
                    />
                  </View>

                  {topMoversTab === 'gainers' ? (
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ color: '#34D399', fontSize: 15, fontWeight: '700' }}>
                          Biggest winners today
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setGainersPage((prev) => Math.max(prev - 1, 0))}
                            disabled={gainersPage === 0}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor:
                                gainersPage === 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.35)',
                              marginRight: 8,
                              opacity: gainersPage === 0 ? 0.5 : 1,
                            }}
                          >
                            <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '600' }}>Prev</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setGainersPage((prev) => Math.min(prev + 1, gainersMaxPage))
                            }
                            disabled={gainersPage >= gainersMaxPage}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor:
                                gainersPage >= gainersMaxPage
                                  ? 'rgba(52, 211, 153, 0.2)'
                                  : 'rgba(52, 211, 153, 0.35)',
                              opacity: gainersPage >= gainersMaxPage ? 0.5 : 1,
                            }}
                          >
                            <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '600' }}>Next</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {visibleGainers.length === 0 ? (
                        <Text style={{ color: '#64748B', fontSize: 13 }}>No gainers data available.</Text>
                      ) : (
                        visibleGainers.map((stock) => {
                          const symbol = stock.symbol.toUpperCase();
                          return (
                            <View key={`gainer-${symbol}`} style={{ position: 'relative' }}>
                              <SelectionHighlightOverlay
                                highlightKey={`stocks:${symbol}`}
                                color="#34D399"
                                borderRadius={12}
                              />
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                  setActiveSymbol(symbol);
                                  setFeaturedOverride({
                                    symbol,
                                    name: stock.name,
                                    market: stock.exchange ?? 'MARKET',
                                    currentPrice: stock.price,
                                    changePercent: stock.changePercent,
                                  });
                                  emitHighlight(symbol);
                                }}
                                style={{
                                  paddingVertical: 10,
                                  borderBottomWidth: 1,
                                  borderColor: 'rgba(30, 41, 59, 0.45)',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <View>
                                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                                    {symbol}
                                  </Text>
                                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                                    {stock.name}
                                  </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                                    {formatLargeCurrency(stock.price)}
                                  </Text>
                                  <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                                    +{stock.changePercent.toFixed(2)}%
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </View>
                  ) : (
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ color: '#F87171', fontSize: 15, fontWeight: '700' }}>
                          Biggest pullbacks today
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setLosersPage((prev) => Math.max(prev - 1, 0))}
                            disabled={losersPage === 0}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor:
                                losersPage === 0 ? 'rgba(248, 113, 113, 0.2)' : 'rgba(248, 113, 113, 0.35)',
                              marginRight: 8,
                              opacity: losersPage === 0 ? 0.5 : 1,
                            }}
                          >
                            <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Prev</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setLosersPage((prev) => Math.min(prev + 1, losersMaxPage))
                            }
                            disabled={losersPage >= losersMaxPage}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor:
                                losersPage >= losersMaxPage
                                  ? 'rgba(248, 113, 113, 0.2)'
                                  : 'rgba(248, 113, 113, 0.35)',
                              opacity: losersPage >= losersMaxPage ? 0.5 : 1,
                            }}
                          >
                            <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Next</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {visibleLosers.length === 0 ? (
                        <Text style={{ color: '#64748B', fontSize: 13 }}>No losers data available.</Text>
                      ) : (
                        visibleLosers.map((stock) => {
                          const symbol = stock.symbol.toUpperCase();
                          return (
                            <View key={`loser-${symbol}`} style={{ position: 'relative' }}>
                              <SelectionHighlightOverlay
                                highlightKey={`stocks:${symbol}`}
                                color="#F87171"
                                borderRadius={12}
                              />
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                  setActiveSymbol(symbol);
                                  setFeaturedOverride({
                                    symbol,
                                    name: stock.name,
                                    market: stock.exchange ?? 'MARKET',
                                    currentPrice: stock.price,
                                    changePercent: stock.changePercent,
                                  });
                                  emitHighlight(symbol);
                                }}
                                style={{
                                  paddingVertical: 10,
                                  borderBottomWidth: 1,
                                  borderColor: 'rgba(30, 41, 59, 0.45)',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <View>
                                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                                    {symbol}
                                  </Text>
                                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                                    {stock.name}
                                  </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                                    {formatLargeCurrency(stock.price)}
                                  </Text>
                                  <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                                    {stock.changePercent.toFixed(2)}%
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}

        <Modal
          visible={tradeModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setTradeModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#0f172a',
                padding: 24,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedHolding?.symbol}
                </Text>
                <TouchableOpacity onPress={() => setTradeModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>
                {selectedHolding?.name}
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: Platform.OS === 'ios' ? 14 : 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(51, 65, 85, 0.7)',
                }}
              >
                <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Quantity</Text>
                <TextInput
                  keyboardType="numeric"
                  value={tradeQuantity}
                  onChangeText={setTradeQuantity}
                  style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}
                  placeholder="0"
                  placeholderTextColor="#1E293B"
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>Price</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  {formatLargeCurrency(selectedHolding?.currentPrice ?? 0)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>Estimated value</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  {formatLargeCurrency(
                    (selectedHolding?.currentPrice ?? 0) * (Number(tradeQuantity) || 0)
                  )}
                </Text>
              </View>
              <TouchableOpacity
                disabled={isSubmittingTrade}
                onPress={handleConfirmTrade}
                style={{
                  backgroundColor: tradeType === 'buy' ? '#3B82F6' : '#F87171',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                {isSubmittingTrade ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    {tradeType === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={{ color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                Orders are simulated for now. Brokerage execution hooks can extend{' '}
                <Text style={{ color: '#3B82F6', fontWeight: '600' }}>stocksService.simulateOrder</Text>.
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </UniversalBackground>
  );
};

