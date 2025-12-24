import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { UniversalBackground, Card, SparklineChart, AnimatedNumber } from '../components';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: number;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  trend: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, iconColor, iconName, trend }) => {
  return (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{formatCurrency(value)}</Text>
    </Animated.View>
  );
};

interface BarChartData {
  day: string;
  value: number;
  isHighlighted?: boolean;
}

interface PortfolioBarChartProps {
  data: BarChartData[];
  maxValue: number;
}

const PortfolioBarChart: React.FC<PortfolioBarChartProps> = ({ data, maxValue }) => {
  const chartHeight = 200;
  const barWidth = (SCREEN_WIDTH - 80) / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartYAxis}>
        {[0, 25, 50, 75, 100].map((val) => (
          <Text key={val} style={styles.chartYLabel}>
            ${val}k
          </Text>
        ))}
      </View>
      <View style={styles.chartBarsContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const isHighlighted = item.isHighlighted || false;
          
          return (
            <View key={index} style={styles.barWrapper}>
              {item.value > 0 && (
                <View style={styles.barValueLabel}>
                  <Text style={styles.barValueText}>
                    {formatCurrency(item.value).replace('.00', '')}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 4),
                    width: barWidth,
                    backgroundColor: isHighlighted ? '#EF4444' : '#3B82F6',
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

interface StockListItemProps {
  stock: StockItem;
}

const StockListItem: React.FC<StockListItemProps> = ({ stock }) => {
  const isPositive = stock.change >= 0;
  
  return (
    <Animated.View entering={FadeInUp} style={styles.stockItem}>
      <View style={styles.stockIconContainer}>
        <View style={[styles.stockIcon, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.stockIconText}>{stock.symbol[0]}</Text>
        </View>
      </View>
      <View style={styles.stockInfo}>
        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
        <Text style={styles.stockName}>{stock.name}</Text>
      </View>
      <View style={styles.stockChart}>
        <SparklineChart
          data={stock.sparklineData}
          width={80}
          height={40}
          color={isPositive ? '#22C55E' : '#EF4444'}
          strokeWidth={2}
        />
      </View>
      <View style={styles.stockPrice}>
        <Text style={styles.stockPriceValue}>{formatCurrency(stock.price)}</Text>
        <Text style={[styles.stockChange, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
          {isPositive ? '+' : ''}{formatPercentage(stock.changePercent)}
        </Text>
      </View>
    </Animated.View>
  );
};

type Timeframe = '12H' | '1D' | '1W' | '1M' | '1Y';

export const MarketScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1W');

  // Mock data - replace with actual data from your stores/services
  const todayGains = 2202.42;
  const overallLoss = 5200.11;
  const totalBalance = 25901.41;
  const balanceChange = 1521.4;
  const balanceChangePercent = 8.1;

  const chartData: BarChartData[] = useMemo(() => {
    const baseData = [
      { day: 'Mo', value: 25000 },
      { day: 'Tu', value: 35000 },
      { day: 'We', value: 74902, isHighlighted: true },
      { day: 'Th', value: 45000 },
      { day: 'Fr', value: 55000 },
      { day: 'Sa', value: 40000 },
      { day: 'Su', value: 30000 },
    ];
    return baseData;
  }, []);

  const maxChartValue = useMemo(() => {
    return Math.max(...chartData.map((d) => d.value), 100000);
  }, [chartData]);

  const topStocks: StockItem[] = useMemo(() => {
    return [
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 213.10,
        change: 2.5,
        changePercent: 2.5,
        sparklineData: [210, 211, 212, 211.5, 212.5, 213, 213.1],
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.50,
        change: -1.2,
        changePercent: -0.68,
        sparklineData: [176, 175.5, 175, 175.2, 175.8, 175.6, 175.5],
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 142.30,
        change: 3.1,
        changePercent: 2.23,
        sparklineData: [139, 140, 141, 141.5, 142, 142.2, 142.3],
      },
    ];
  }, []);

  const timeframes: Timeframe[] = ['12H', '1D', '1W', '1M', '1Y'];

  return (
    <UniversalBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Metric Cards */}
          <View style={styles.metricsRow}>
            <MetricCard
              title="Today Gains"
              value={todayGains}
              iconColor="#3B82F6"
              iconName="trending-down"
              trend="down"
            />
            <MetricCard
              title="Overall Loss"
              value={overallLoss}
              iconColor="#EF4444"
              iconName="trending-up"
              trend="up"
            />
          </View>

          {/* Total Balance Section */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Your total balance</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceMain}>
                <Text style={styles.balanceValue}>{formatCurrency(totalBalance)}</Text>
                <Text style={styles.balanceSubValue}>{formatCurrency(balanceChange)}</Text>
              </View>
              <View style={styles.balanceIndicators}>
                <View style={[styles.changePill, { backgroundColor: '#22C55E' }]}>
                  <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                  <Text style={styles.changePillText}>{balanceChangePercent}%</Text>
                </View>
                <TouchableOpacity style={styles.bellButton}>
                  <Ionicons name="notifications-outline" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Portfolio Chart Section */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.chartSection}>
            <PortfolioBarChart data={chartData} maxValue={maxChartValue} />
            
            {/* Timeframe Selector */}
            <View style={styles.timeframeContainer}>
              {timeframes.map((timeframe) => (
                <TouchableOpacity
                  key={timeframe}
                  style={[
                    styles.timeframeButton,
                    selectedTimeframe === timeframe && styles.timeframeButtonActive,
                  ]}
                  onPress={() => setSelectedTimeframe(timeframe)}
                >
                  <Text
                    style={[
                      styles.timeframeText,
                      selectedTimeframe === timeframe && styles.timeframeTextActive,
                    ]}
                  >
                    {timeframe}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Top Stocks Section */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.stocksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top stocks</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.stocksList}>
              {topStocks.map((stock, index) => (
                <StockListItem key={stock.symbol} stock={stock} />
              ))}
            </View>
          </Animated.View>
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceMain: {
    flex: 1,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  balanceSubValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  balanceIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bellButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 240,
    marginBottom: 16,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  chartYLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  chartBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barValueLabel: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  timeframeButtonActive: {
    backgroundColor: '#EF4444',
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stocksSection: {
    marginBottom: 24,
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
    color: '#000000',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  stocksList: {
    gap: 12,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  stockIconContainer: {
    marginRight: 12,
  },
  stockIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  stockName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  stockChart: {
    marginRight: 12,
  },
  stockPrice: {
    alignItems: 'flex-end',
  },
  stockPriceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  stockChange: {
    fontSize: 13,
    fontWeight: '600',
  },
});
