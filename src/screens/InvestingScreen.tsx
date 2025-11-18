import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, useWindowDimensions, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import investingData from '../../mockData/investing.json';
import { Investment, InvestmentHolding, RootStackParamList, PortfolioMetrics, HoldingPerformance, DiversificationMetrics } from '../types';
import { formatLargeCurrency } from '../utils/formatters';
import { investingService } from '../services/api/investingService';
import { portfolioAnalyticsService } from '../services/api/portfolioAnalyticsService';
import { usePrices } from '../hooks/token/usePrices';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { UniversalBackground } from '../components';

const investments: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

type InvestingScreenNavigation = StackNavigationProp<RootStackParamList, 'Investing'>;

export const InvestingScreen: React.FC = () => {
  const navigation = useNavigation<InvestingScreenNavigation>();
  const { currentWallet } = useWalletStore();
  const { getTokenPrice } = usePrices();
  const { width: screenWidth } = useWindowDimensions();
  const isWideLayout = screenWidth >= 720;
  const metricValueFontSize = isWideLayout ? 24 : 20;
  const metricSubtitleFontSize = isWideLayout ? 13 : 12;
  const metricDescriptionFontSize = isWideLayout ? 14 : 13;
  const metricCardVerticalPadding = isWideLayout ? 24 : 20;

  const [holdings, setHoldings] = useState<InvestmentHolding[]>(() =>
    investments
      .map((investment) => ({
        ...investment,
        currentPrice: 0,
        changePercent: 0,
        marketValue: 0,
      }))
      .sort((a, b) => b.marketValue - a.marketValue)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeCapitalValue = useMemo(() => {
    if (!currentWallet?.tokens) {
      return 0;
    }

    const stableToken = currentWallet.tokens.find((token) => token.symbol?.toUpperCase() === 'USDT');

    if (!stableToken) {
      return 0;
    }

    const balance = parseFloat(stableToken.balance || '0') || 0;
    const price = stableToken.currentPrice || getTokenPrice(stableToken.address) || 1;
    const usdValue = balance * price;

    return Number.isFinite(usdValue) ? usdValue : 0;
  }, [currentWallet?.tokens, getTokenPrice]);

  const totalInvestmentCost = useMemo(() => {
    return investments.reduce((total, investment) => {
      return total + investment.quantity * investment.averagePrice;
    }, 0);
  }, []);

  const totalMarketValue = useMemo(() => {
    return holdings.reduce((total, holding) => total + holding.marketValue, 0);
  }, [holdings]);

  // Calculate portfolio analytics
  const portfolioMetrics = useMemo(() => {
    const holdingsPerformance = portfolioAnalyticsService.calculateHoldingPerformance(
      holdings.map((h) => ({
        symbol: h.symbol,
        costBasis: h.quantity * h.averagePrice,
        currentValue: h.marketValue,
      })),
      totalMarketValue
    );

    const diversification = portfolioAnalyticsService.calculateDiversification(holdingsPerformance);

    // Calculate basic metrics from current holdings
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
    const totalReturn = totalMarketValue - totalCostBasis;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

    // For advanced metrics, we'd need historical data
    // For now, we'll calculate what we can from current data
    const metrics: PortfolioMetrics = {
      totalReturn,
      totalReturnPercent,
      maxDrawdown: 0, // Would need historical data
      maxDrawdownPercent: 0, // Would need historical data
    };

    return {
      metrics,
      holdingsPerformance,
      diversification,
    };
  }, [holdings, totalMarketValue]);

  const loadQuotes = useCallback(async () => {
    if (investments.length === 0) {
      setHoldings([]);
      return;
    }

    const response = await investingService.fetchQuotes(investments);
    const quotes = response.data || {};

    setHoldings((previousHoldings) =>
      investments
        .map((investment) => {
          const symbol = investment.symbol.toUpperCase();
          const quote = quotes[symbol];
          const previous = previousHoldings.find((holding) => holding.id === investment.id);

          const currentPrice =
            typeof quote?.price === 'number' && Number.isFinite(quote.price)
              ? quote.price
              : previous?.currentPrice ?? 0;

          const changePercent =
            typeof quote?.changePercent === 'number' && Number.isFinite(quote.changePercent)
              ? quote.changePercent
              : previous?.changePercent ?? 0;

          const marketValue = investment.quantity * currentPrice;

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadQuotes();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadQuotes]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [loadQuotes])
  );

  const handleSelectHolding = useCallback(
    (holding: InvestmentHolding) => {
      navigation.navigate('InvestmentDetails', { holding });
    },
    [navigation]
  );

  const metricCards = useMemo(
    () => [
      {
        id: 'active-capital',
        title: 'ACTIVE CAPITAL',
        value: formatLargeCurrency(activeCapitalValue),
        description: 'USDT stable reserves allocated to deployments',
        accentColor: '#5EEAD4',
      },
      {
        id: 'cost-basis',
        title: 'TOTAL INVESTMENT',
        value: formatLargeCurrency(totalInvestmentCost),
        description: 'Sum of allocations across strategies',
        accentColor: '#38BDF8',
      },
      {
        id: 'market-value',
        title: 'CURRENT MARKET VALUE',
        value: formatLargeCurrency(totalMarketValue),
        description: 'Updated using live market quotes',
        accentColor: '#F97316',
      },
    ],
    [activeCapitalValue, totalInvestmentCost, totalMarketValue]
  );

  const renderHeader = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.25)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>Investing</Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
            Stocks, forex & managed strategies
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: isWideLayout ? 'row' : 'column',
          justifyContent: isWideLayout ? 'space-between' : 'flex-start',
          marginBottom: isWideLayout ? 32 : 24,
        }}
      >
        {metricCards.map((card, index) => (
          <Animated.View
            key={card.id}
            entering={FadeInUp.delay(100 + index * 100)}
            exiting={FadeOutDown}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(30, 41, 59, 0.65)',
              padding: metricCardVerticalPadding,
              flex: isWideLayout ? 1 : undefined,
              marginRight: isWideLayout && index < metricCards.length - 1 ? 16 : 0,
              marginBottom: !isWideLayout && index < metricCards.length - 1 ? 16 : 0,
            }}
          >
            <Text style={{ color: '#94A3B8', fontSize: metricSubtitleFontSize, fontWeight: '600', letterSpacing: 0.75 }}>
              {card.title}
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: metricValueFontSize,
                fontWeight: '700',
                marginTop: 12,
              }}
            >
              {card.value}
            </Text>
            <Text
              style={{
                color: card.accentColor,
                fontSize: metricDescriptionFontSize,
                marginTop: 4,
              }}
            >
              {card.description}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Portfolio Analytics Section */}
      {portfolioMetrics && (
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(30, 41, 59, 0.65)',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75, marginBottom: 16 }}>
            PORTFOLIO ANALYTICS
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Total Return</Text>
              <Text
                style={{
                  color: portfolioMetrics.metrics.totalReturn >= 0 ? '#34D399' : '#F87171',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                {portfolioMetrics.metrics.totalReturn >= 0 ? '+' : ''}
                {formatLargeCurrency(portfolioMetrics.metrics.totalReturn)}
              </Text>
              <Text
                style={{
                  color: portfolioMetrics.metrics.totalReturnPercent >= 0 ? '#34D399' : '#F87171',
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                ({portfolioMetrics.metrics.totalReturnPercent >= 0 ? '+' : ''}
                {portfolioMetrics.metrics.totalReturnPercent.toFixed(2)}%)
              </Text>
            </View>

            <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Diversification</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
                {portfolioMetrics.diversification.effectiveHoldings.toFixed(1)} effective holdings
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                Concentration: {(portfolioMetrics.diversification.concentration * 100).toFixed(1)}%
              </Text>
            </View>

            {portfolioMetrics.holdingsPerformance.length > 0 && (
              <View style={{ flex: 1, minWidth: '100%', marginTop: 8 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 8 }}>Top Holdings by Weight</Text>
                {portfolioMetrics.holdingsPerformance
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 3)
                  .map((holding, index) => (
                    <View
                      key={holding.symbol}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                        paddingBottom: 8,
                        borderBottomWidth: index < 2 ? 1 : 0,
                        borderBottomColor: 'rgba(30, 41, 59, 0.5)',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>{holding.symbol}</Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                          {holding.profitLossPercent >= 0 ? '+' : ''}
                          {holding.profitLossPercent.toFixed(2)}% P&L
                        </Text>
                      </View>
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        {holding.weight.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>
      )}

      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
        Holdings
      </Text>
    </View>
  );

  const renderHolding = ({ item, index }: { item: InvestmentHolding; index: number }) => {
    const isPositive = item.changePercent >= 0;
    return (
      <Animated.View
        entering={FadeInUp.delay(350 + index * 40)}
        style={{ marginBottom: 12 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectHolding(item)}
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(30, 41, 59, 0.55)',
            padding: 18,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {item.icon ? (
                <Image
                  source={{ uri: item.icon }}
                  style={{ width: 40, height: 40, borderRadius: 12, marginRight: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    marginRight: 12,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '600' }}>{item.symbol.slice(0, 3).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                  {item.symbol} • {item.type.toUpperCase()} • {item.market}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Market Value</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                {formatLargeCurrency(item.marketValue)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Quantity</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                {item.quantity.toLocaleString()}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'right' }}>24H Change</Text>
              <Text
                style={{
                  color: isPositive ? '#34D399' : '#F87171',
                  fontSize: 15,
                  fontWeight: '600',
                  marginTop: 4,
                }}
              >
                {isPositive ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Entry</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                {formatLargeCurrency(item.averagePrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                {formatLargeCurrency(item.currentPrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Currency</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                {item.currency}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={holdings}
          keyExtractor={(item) => item.id}
          renderItem={renderHolding}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </SafeAreaView>
    </UniversalBackground>
  );
};
