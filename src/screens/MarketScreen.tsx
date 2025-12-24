import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { UniversalBackground, SparklineChart } from '../components';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'Overview' | 'Watchlist' | 'Chart';

interface FeaturedStock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: number[];
  rsi: number;
  sma: number;
}

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  chartData: number[];
  iconColor: string;
}

interface PortfolioStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  iconColor: string;
}

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  chartData: number[];
  iconColor: string;
}

export const MarketScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('This week');

  const featuredStock: FeaturedStock = useMemo(() => ({
    symbol: 'BRK-A',
    name: 'Berkshire Hathaway Inc. Class A',
    exchange: 'NYSE',
    price: 752546.07,
    change: 0,
    changePercent: 0,
    chartData: [750000, 751000, 752000, 751500, 752500, 753000, 752546],
    rsi: 42.8,
    sma: 752546.07,
  }), []);

  const trendingStocks: TrendingStock[] = useMemo(() => [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 178.23,
      changePercent: 1.24,
      chartData: [175, 176, 177, 176.5, 177.5, 178, 178.23],
      iconColor: '#FFFFFF',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 328.71,
      changePercent: 2.0,
      chartData: [325, 326, 327, 326.5, 327.5, 328, 328.71],
      iconColor: '#3B82F6',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 472.5,
      changePercent: 4.0,
      chartData: [465, 470, 472, 471, 472.5, 473, 472.5],
      iconColor: '#22C55E',
    },
  ], []);

  const portfolioStocks: PortfolioStock[] = useMemo(() => [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 357.57,
      changePercent: 1.7,
      iconColor: '#000000',
    },
    {
      symbol: 'LYFT',
      name: 'Lyft Inc.',
      price: 635.07,
      changePercent: 3.5,
      iconColor: '#FF00BF',
    },
  ], []);

  const watchlistStocks: WatchlistStock[] = useMemo(() => [
    {
      symbol: 'SPOT',
      name: 'Spotify Technology',
      price: 213.10,
      changePercent: 3.3,
      chartData: [210, 211, 212, 211.5, 212.5, 213, 213.1],
      iconColor: '#1DB954',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 213.10,
      changePercent: 2.8,
      chartData: [210, 211, 212, 211.5, 212.5, 213, 213.1],
      iconColor: '#4285F4',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 213.10,
      changePercent: -3.5,
      chartData: [220, 218, 215, 214, 213.5, 213.2, 213.1],
      iconColor: '#00A4EF',
    },
  ], []);

  const stockGainsValue = 29855.35;

  const renderTrendingStock = ({ item }: { item: TrendingStock }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View entering={FadeInUp} style={styles.trendingCard}>
        <View style={[styles.stockIconSquare, { backgroundColor: '#1E293B' }]}>
          <View style={[styles.stockIconCircle, { backgroundColor: item.iconColor }]}>
            <Text style={styles.stockIconText}>{item.symbol[0]}</Text>
          </View>
        </View>
        <Text style={styles.trendingSymbol}>{item.symbol}</Text>
        <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.trendingPrice}>{formatCurrency(item.price)}</Text>
        <Text style={[styles.trendingChange, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
          {isPositive ? '+' : ''}{formatPercentage(item.changePercent)}
        </Text>
      </Animated.View>
    );
  };

  const renderPortfolioStock = ({ item }: { item: PortfolioStock }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View entering={FadeInUp} style={[styles.portfolioCard, { backgroundColor: '#F3F4F6' }]}>
        <View style={[styles.portfolioIconCircle, { backgroundColor: item.iconColor }]}>
          <Text style={styles.portfolioIconText}>{item.symbol[0]}</Text>
        </View>
        <Text style={styles.portfolioSymbol}>{item.symbol}</Text>
        <Text style={styles.portfolioName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.portfolioPrice}>{item.price.toFixed(2)}</Text>
        <View style={styles.portfolioChangeRow}>
          <Ionicons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={isPositive ? '#22C55E' : '#EF4444'} 
          />
          <Text style={[styles.portfolioChange, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
            {formatPercentage(item.changePercent)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderWatchlistStock = ({ item }: { item: WatchlistStock }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View entering={FadeInUp} style={styles.watchlistItem}>
        <View style={[styles.watchlistIconCircle, { backgroundColor: item.iconColor }]}>
          <Text style={styles.watchlistIconText}>{item.symbol[0]}</Text>
        </View>
        <View style={styles.watchlistInfo}>
          <Text style={styles.watchlistSymbol}>{item.symbol}</Text>
          <Text style={styles.watchlistName} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.watchlistChart}>
          <SparklineChart
            data={item.chartData}
            width={60}
            height={30}
            color={isPositive ? '#22C55E' : '#EF4444'}
            strokeWidth={2}
          />
        </View>
        <View style={styles.watchlistPrice}>
          <Text style={styles.watchlistPriceValue}>{formatCurrency(item.price)}</Text>
          <View style={styles.watchlistChangeRow}>
            <Ionicons 
              name={isPositive ? 'arrow-up' : 'arrow-down'} 
              size={12} 
              color={isPositive ? '#22C55E' : '#EF4444'} 
            />
            <Text style={[styles.watchlistChange, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
              {formatPercentage(item.changePercent)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Markets</Text>
              <Text style={styles.subtitle}>Live equity, ETF, forex & commodity signals</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            {(['Overview', 'Watchlist', 'Chart'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#3B82F6" />
              <Text style={styles.refreshText}>Refresh data</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Overview' && (
            <>
              {/* Featured Section */}
              <View style={styles.featuredSection}>
                <Text style={styles.featuredLabel}>FEATURED</Text>
                <Text style={styles.featuredName}>{featuredStock.name}</Text>
                <Text style={styles.featuredTicker}>
                  {featuredStock.symbol} • {featuredStock.exchange}
                </Text>
                <View style={styles.featuredPriceRow}>
                  <View>
                    <Text style={styles.featuredPrice}>{formatCurrency(featuredStock.price)}</Text>
                    <Text style={[styles.featuredChange, { color: '#22C55E' }]}>
                      {featuredStock.change >= 0 ? '+' : ''}{formatCurrency(featuredStock.change)} ({featuredStock.changePercent >= 0 ? '+' : ''}{formatPercentage(featuredStock.changePercent)})
                    </Text>
                  </View>
                </View>
                <View style={styles.featuredChart}>
                  <SparklineChart
                    data={featuredStock.chartData}
                    width={SCREEN_WIDTH - 64}
                    height={200}
                    color="#22C55E"
                    strokeWidth={3}
                  />
                </View>
                <View style={styles.featuredIndicators}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>RSI N</Text>
                    <Text style={styles.indicatorValue}>{featuredStock.rsi}</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>SMA(20)</Text>
                    <Text style={styles.indicatorValue}>{formatCurrency(featuredStock.sma)}</Text>
                  </View>
                </View>
              </View>

              {/* Trending Section */}
              <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending</Text>
                  <TouchableOpacity>
                    <Text style={styles.refreshLink}>Refresh</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={trendingStocks}
                  renderItem={renderTrendingStock}
                  keyExtractor={(item) => item.symbol}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingList}
                />
              </View>
            </>
          )}

          {activeTab === 'Watchlist' && (
            <>
              {/* Stock Gains Section */}
              <View style={styles.gainsSection}>
                <View style={styles.gainsHeader}>
                  <Text style={styles.gainsTitle}>Stock Gains</Text>
                  <TouchableOpacity style={styles.timeframeButton}>
                    <Text style={styles.timeframeText}>{selectedTimeframe}</Text>
                    <Ionicons name="chevron-down" size={16} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.gainsValue}>{formatCurrency(stockGainsValue)}</Text>
                <View style={styles.gainsChart}>
                  <SparklineChart
                    data={[25000, 26000, 27000, 28000, 29000, 28500, 29855]}
                    width={SCREEN_WIDTH - 64}
                    height={150}
                    color="#7C3AED"
                    strokeWidth={3}
                  />
                </View>
              </View>

              {/* Portfolio Section */}
              <View style={styles.portfolioSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Portfolio</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={portfolioStocks}
                  renderItem={renderPortfolioStock}
                  keyExtractor={(item) => item.symbol}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.portfolioList}
                />
              </View>

              {/* Watchlist Section */}
              <View style={styles.watchlistSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Watchlist</Text>
                  <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                <View style={styles.watchlistList}>
                  {watchlistStocks.map((stock) => (
                    <View key={stock.symbol}>
                      {renderWatchlistStock({ item: stock })}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  featuredSection: {
    marginBottom: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredTicker: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 16,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featuredPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuredChart: {
    marginBottom: 20,
    height: 200,
  },
  featuredIndicators: {
    flexDirection: 'row',
    gap: 24,
  },
  indicator: {
    flex: 1,
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 4,
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendingSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  trendingList: {
    paddingRight: 16,
  },
  trendingCard: {
    width: 140,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  stockIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendingSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trendingName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 8,
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trendingChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  gainsSection: {
    marginBottom: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  gainsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gainsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeframeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
  },
  gainsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  gainsChart: {
    height: 150,
  },
  portfolioSection: {
    marginBottom: 32,
  },
  portfolioList: {
    paddingRight: 16,
  },
  portfolioCard: {
    width: 160,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  portfolioIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  portfolioSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  portfolioName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  portfolioPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  portfolioChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portfolioChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  watchlistSection: {
    marginBottom: 32,
  },
  watchlistList: {
    gap: 12,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  watchlistIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  watchlistIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  watchlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  watchlistSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  watchlistName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
  },
  watchlistChart: {
    marginRight: 12,
  },
  watchlistPrice: {
    alignItems: 'flex-end',
  },
  watchlistPriceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  watchlistChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchlistChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
});
