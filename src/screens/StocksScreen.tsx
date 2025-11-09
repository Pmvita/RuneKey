import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import investingData from '../../mockData/investing.json';
import { Investment, InvestmentHolding } from '../types';
import { investingService } from '../services/api/investingService';
import { formatLargeCurrency } from '../utils/formatters';
import { SparklineChart, UniversalBackground } from '../components';
import { stocksService, StockNewsItem, TrendingStock } from '../services/api/stocksService';

const investments: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

const DEFAULT_RANGE = '1mo';

export const StocksScreen: React.FC = () => {
  const [holdings, setHoldings] = useState<InvestmentHolding[]>(() =>
    investments.map((investment) => ({
      ...investment,
      currentPrice: 0,
      changePercent: 0,
      marketValue: 0,
    }))
  );
  const [featuredChart, setFeaturedChart] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [newsItems, setNewsItems] = useState<StockNewsItem[]>([]);
  const [selectedHolding, setSelectedHolding] = useState<InvestmentHolding | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQuantity, setTradeQuantity] = useState<string>('1');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [featuredOverride, setFeaturedOverride] = useState<
    (Partial<InvestmentHolding> & { symbol: string }) | null
  >(null);

  const featuredHolding = useMemo(() => holdings[0] ?? null, [holdings]);
  const featuredInstrument = useMemo(() => {
    if (!featuredOverride) {
      return featuredHolding;
    }

    const backing = holdings.find(
      (holding) => holding.symbol === featuredOverride.symbol.toUpperCase()
    );

    return {
      ...(backing || {
        id: featuredOverride.symbol,
        symbol: featuredOverride.symbol,
        name: featuredOverride.name ?? featuredOverride.symbol,
        market: backing?.market ?? 'MARKET',
        quantity: featuredOverride.quantity ?? 0,
        averagePrice: featuredOverride.averagePrice ?? featuredOverride.currentPrice ?? 0,
      }),
      ...featuredOverride,
    } as InvestmentHolding;
  }, [featuredHolding, featuredOverride, holdings]);

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

        if (overrides) {
          setFeaturedOverride((prev) => {
            if (!prev || prev.symbol.toUpperCase() !== symbol.toUpperCase()) {
              return prev;
            }
            const next = {
              ...prev,
              ...overrides,
              symbol: symbol.toUpperCase(),
            };
            if (
              next.currentPrice === prev.currentPrice &&
              next.changePercent === prev.changePercent &&
              next.name === prev.name &&
              next.market === prev.market
            ) {
              return prev;
            }
            return next;
          });
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

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadQuotes(), loadMarketExtras()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadQuotes, loadMarketExtras]);

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
    if (!featuredOverride) return;
    const match = holdings.find((holding) => holding.symbol === featuredOverride.symbol.toUpperCase());
    if (match) {
      setFeaturedOverride((prev) => {
        if (!prev) return prev;
        if (
          prev.symbol === match.symbol &&
          prev.currentPrice === match.currentPrice &&
          prev.changePercent === match.changePercent &&
          prev.quantity === match.quantity &&
          prev.market === match.market
        ) {
          return prev;
        }
        return { ...prev, ...match, symbol: match.symbol };
      });
    }
  }, [holdings, featuredOverride?.symbol]);

  useEffect(() => {
    loadMarketExtras();
  }, [loadMarketExtras]);

  useFocusEffect(
    useCallback(() => {
      loadMarketExtras();
    }, [loadMarketExtras])
  );

  const openTradeModal = (holding: InvestmentHolding, side: 'buy' | 'sell') => {
    setSelectedHolding(holding);
    setTradeType(side);
    setTradeQuantity('1');
    setTradeModalVisible(true);
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} tintColor="#3B82F6" />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Markets</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                Live equity, ETF, forex & commodity signals
              </Text>
            </View>
            <TouchableOpacity
              onPress={refreshAll}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.35)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="refresh" size={16} color="#3B82F6" />
                <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                  Refresh
                </Text>
              </View>
            </TouchableOpacity>
          </View>

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
                  return (
                    <TouchableOpacity
                      key={stock.symbol}
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
                        const holdingMatch = holdings.find((h) => h.symbol === stock.symbol.toUpperCase());
                        if (holdingMatch) {
                          setHoldings((prev) =>
                            prev
                              .map((h) =>
                                h.symbol === stock.symbol.toUpperCase()
                                  ? {
                                      ...h,
                                      currentPrice: stock.price,
                                      changePercent: stock.changePercent,
                                      marketValue: stock.price * h.quantity,
                                    }
                                  : h
                              )
                              .sort((a, b) => b.marketValue - a.marketValue)
                          );
                        }

                        setFeaturedOverride({
                          symbol: stock.symbol.toUpperCase(),
                          name: stock.name,
                          market: holdingMatch?.market ?? 'MARKET',
                          currentPrice: stock.price,
                          changePercent: stock.changePercent,
                        });
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
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Watchlist</Text>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>AUTO-SYNCED</Text>
          </View>

          <FlatList
            data={holdings.slice(0, 10)}
            keyExtractor={(item) => item.id}
            renderItem={renderHolding}
            scrollEnabled={false}
          />

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

