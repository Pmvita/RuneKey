import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { UniversalBackground, SparklineChart } from '../components';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useThemeColors } from '../utils/theme';

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
  const colors = useThemeColors();
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
      <Animated.View entering={FadeInUp} style={[styles.trendingCard, { backgroundColor: colors.backgroundCard, borderColor: colors.primary + '33' }]}>
        <View style={[styles.stockIconSquare, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={[styles.stockIconCircle, { backgroundColor: item.iconColor }]}>
            <Text style={[styles.stockIconText, { color: colors.textInverse }]}>{item.symbol[0]}</Text>
          </View>
        </View>
        <Text style={[styles.trendingSymbol, { color: colors.textPrimary }]}>{item.symbol}</Text>
        <Text style={[styles.trendingName, { color: colors.textTertiary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.trendingPrice, { color: colors.textPrimary }]}>{formatCurrency(item.price)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={12} 
            color={isPositive ? colors.success : colors.error} 
          />
          <Text style={[styles.trendingChange, { color: isPositive ? colors.success : colors.error }]}>
            {isPositive ? '+' : ''}{formatPercentage(item.changePercent)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderPortfolioStock = ({ item }: { item: PortfolioStock }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View entering={FadeInUp} style={[styles.portfolioCard, { backgroundColor: colors.backgroundCard }]}>
        <View style={[styles.portfolioIconCircle, { backgroundColor: item.iconColor }]}>
          <Text style={[styles.portfolioIconText, { color: colors.textInverse }]}>{item.symbol[0]}</Text>
        </View>
        <Text style={[styles.portfolioSymbol, { color: colors.textPrimary }]}>{item.symbol}</Text>
        <Text style={[styles.portfolioName, { color: colors.textTertiary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.portfolioPrice, { color: colors.textPrimary }]}>{item.price.toFixed(2)}</Text>
        <View style={styles.portfolioChangeRow}>
          <Ionicons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={isPositive ? colors.success : colors.error} 
          />
          <Text style={[styles.portfolioChange, { color: isPositive ? colors.success : colors.error }]}>
            {formatPercentage(item.changePercent)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderWatchlistStock = ({ item }: { item: WatchlistStock }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View entering={FadeInUp} style={[styles.watchlistItem, { backgroundColor: colors.backgroundCard }]}>
        <View style={[styles.watchlistIconCircle, { backgroundColor: item.iconColor }]}>
          <Text style={[styles.watchlistIconText, { color: colors.textInverse }]}>{item.symbol[0]}</Text>
        </View>
        <View style={styles.watchlistInfo}>
          <Text style={[styles.watchlistSymbol, { color: colors.textPrimary }]}>{item.symbol}</Text>
          <Text style={[styles.watchlistName, { color: colors.textTertiary }]} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.watchlistChart}>
          <SparklineChart
            data={item.chartData}
            width={60}
            height={30}
            color={isPositive ? colors.success : colors.error}
            strokeWidth={2}
          />
        </View>
        <View style={styles.watchlistPrice}>
          <Text style={[styles.watchlistPriceValue, { color: colors.textPrimary }]}>{formatCurrency(item.price)}</Text>
          <View style={styles.watchlistChangeRow}>
            <Ionicons 
              name={isPositive ? 'arrow-up' : 'arrow-down'} 
              size={12} 
              color={isPositive ? colors.success : colors.error} 
            />
            <Text style={[styles.watchlistChange, { color: isPositive ? colors.success : colors.error }]}>
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
              <Text style={[styles.title, { color: colors.textPrimary }]}>Markets</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Live equity, ETF, forex & commodity signals</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            {(['Overview', 'Watchlist', 'Chart'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab, 
                  { backgroundColor: colors.backgroundCard },
                  activeTab === tab && { backgroundColor: colors.primary + '33' }
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText, 
                  { color: colors.textTertiary },
                  activeTab === tab && { color: colors.textPrimary, fontWeight: '600' }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh data</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Overview' && (
            <>
              {/* Featured Section */}
              <View style={[styles.featuredSection, { backgroundColor: colors.backgroundCard, borderColor: colors.primary + '33' }]}>
                <Text style={[styles.featuredLabel, { color: colors.textTertiary }]}>FEATURED</Text>
                <Text style={[styles.featuredName, { color: colors.textPrimary }]}>{featuredStock.name}</Text>
                <Text style={[styles.featuredTicker, { color: colors.textSecondary }]}>
                  {featuredStock.symbol} • {featuredStock.exchange}
                </Text>
                <View style={styles.featuredPriceRow}>
                  <View>
                    <Text style={[styles.featuredPrice, { color: colors.textPrimary }]}>{formatCurrency(featuredStock.price)}</Text>
                    <Text style={[styles.featuredChange, { color: colors.success }]}>
                      {featuredStock.change >= 0 ? '+' : ''}{formatCurrency(featuredStock.change)} ({featuredStock.changePercent >= 0 ? '+' : ''}{formatPercentage(featuredStock.changePercent)})
                    </Text>
                  </View>
                </View>
                <View style={styles.featuredChart}>
                  <SparklineChart
                    data={featuredStock.chartData}
                    width={SCREEN_WIDTH - 64}
                    height={200}
                    color={colors.success}
                    strokeWidth={3}
                  />
                </View>
                <View style={styles.featuredIndicators}>
                  <View style={styles.indicator}>
                    <Text style={[styles.indicatorLabel, { color: colors.textTertiary }]}>RSI N</Text>
                    <Text style={[styles.indicatorValue, { color: colors.textPrimary }]}>{featuredStock.rsi}</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={[styles.indicatorLabel, { color: colors.textTertiary }]}>SMA(20)</Text>
                    <Text style={[styles.indicatorValue, { color: colors.textPrimary }]}>{formatCurrency(featuredStock.sma)}</Text>
                  </View>
                </View>
              </View>

              {/* Trending Section */}
              <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending</Text>
                  <TouchableOpacity>
                    <Text style={[styles.refreshLink, { color: colors.primary }]}>Refresh</Text>
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
              <View style={[styles.gainsSection, { backgroundColor: colors.backgroundCard, borderColor: colors.primary + '33' }]}>
                <View style={styles.gainsHeader}>
                  <Text style={[styles.gainsTitle, { color: colors.textPrimary }]}>Stock Gains</Text>
                  <TouchableOpacity style={styles.timeframeButton}>
                    <Text style={[styles.timeframeText, { color: colors.textPrimary }]}>{selectedTimeframe}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.accent} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.gainsValue, { color: colors.textPrimary }]}>{formatCurrency(stockGainsValue)}</Text>
                <View style={styles.gainsChart}>
                  <SparklineChart
                    data={[25000, 26000, 27000, 28000, 29000, 28500, 29855]}
                    width={SCREEN_WIDTH - 64}
                    height={150}
                    color={colors.accent}
                    strokeWidth={3}
                  />
                </View>
              </View>

              {/* Portfolio Section */}
              <View style={styles.portfolioSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Portfolio</Text>
                  <TouchableOpacity>
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
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
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Watchlist</Text>
                  <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color={colors.accent} />
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
    marginBottom: 4,
    // color will be set dynamically
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    // color will be set dynamically
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
    // backgroundColor will be set dynamically
  },
  tabActive: {
    // backgroundColor will be set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    // color will be set dynamically
  },
  tabTextActive: {
    fontWeight: '600',
    // color will be set dynamically
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
    // color will be set dynamically
  },
  featuredSection: {
    marginBottom: 32,
    // backgroundColor will be set dynamically
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    // color will be set dynamically
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    // color will be set dynamically
  },
  featuredTicker: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 16,
    // color will be set dynamically
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
    marginBottom: 4,
    // color will be set dynamically
  },
  featuredChange: {
    fontSize: 14,
    fontWeight: '500',
    // color will be set dynamically
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
    marginBottom: 4,
    // color will be set dynamically
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: '600',
    // color will be set dynamically
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
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    // backgroundColor and borderColor will be set dynamically
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
    // color will be set dynamically
  },
  trendingSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    // color will be set dynamically
  },
  trendingName: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 8,
    // color will be set dynamically
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    // color will be set dynamically
  },
  trendingChange: {
    fontSize: 13,
    fontWeight: '600',
    // color will be set dynamically
  },
  gainsSection: {
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    // backgroundColor and borderColor will be set dynamically
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
    // color will be set dynamically
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
    // color will be set dynamically
  },
  gainsValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    // color will be set dynamically
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
    // color will be set dynamically
  },
  portfolioSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    // color will be set dynamically
  },
  portfolioName: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 8,
    textAlign: 'center',
    // color will be set dynamically
  },
  portfolioPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    // color will be set dynamically
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    // backgroundColor and borderColor will be set dynamically
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
    // color will be set dynamically
  },
  watchlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  watchlistSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    // color will be set dynamically
  },
  watchlistName: {
    fontSize: 13,
    fontWeight: '400',
    // color will be set dynamically
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
    marginBottom: 4,
    // color will be set dynamically
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
