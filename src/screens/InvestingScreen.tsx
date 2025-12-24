import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, useWindowDimensions, Image, FlatList, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import investingData from '../mockData/api/investing.json';
import { Investment, InvestmentHolding, RootStackParamList, PortfolioMetrics, HoldingPerformance, DiversificationMetrics } from '../types';
import { formatLargeCurrency, formatPercentage } from '../utils/formatters';
import { investingService } from '../services/api/investingService';
import { portfolioAnalyticsService } from '../services/api/portfolioAnalyticsService';
import { usePrices } from '../hooks/token/usePrices';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { UniversalBackground, SparklineChart } from '../components';

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');
  const [filterType, setFilterType] = useState<'all' | 'stock' | 'etf' | 'forex' | 'commodity'>('all');

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
    // Calculate dividend income
    const totalDividendIncome = holdings.reduce((sum, h) => {
      return sum + (h.annualDividendIncome ?? 0);
    }, 0);

    // Calculate portfolio dividend yield (weighted average)
    const portfolioDividendYield = totalMarketValue > 0
      ? (totalDividendIncome / totalMarketValue) * 100
      : 0;

    const holdingsPerformance = portfolioAnalyticsService.calculateHoldingPerformance(
      holdings.map((h) => ({
        symbol: h.symbol,
        costBasis: h.quantity * h.averagePrice,
        currentValue: h.marketValue,
        annualDividendIncome: h.annualDividendIncome,
        dividendYield: h.dividendYield,
      })),
      totalMarketValue
    );

    // Add dividend data to holdings performance
    holdingsPerformance.forEach((hp) => {
      const holding = holdings.find((h) => h.symbol === hp.symbol);
      if (holding) {
        hp.annualDividendIncome = holding.annualDividendIncome;
        hp.dividendYield = holding.dividendYield;
      }
    });

    const diversification = portfolioAnalyticsService.calculateDiversification(holdingsPerformance);

    // Calculate basic metrics from current holdings
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
    
    // Capital gains (price appreciation/depreciation)
    const capitalGains = totalMarketValue - totalCostBasis;
    const capitalGainsPercent = totalCostBasis > 0 ? (capitalGains / totalCostBasis) * 100 : 0;
    
    // Total return includes both capital gains and dividend income
    const totalReturn = capitalGains + totalDividendIncome;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

    // For advanced metrics, we'd need historical data
    // For now, we'll calculate what we can from current data
    const metrics: PortfolioMetrics = {
      totalReturn,
      totalReturnPercent,
      capitalGains,
      capitalGainsPercent,
      dividendIncome: totalDividendIncome,
      dividendYield: portfolioDividendYield,
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

          // Extract dividend data
          const dividendYield = quote?.dividendYield ?? previous?.dividendYield;
          const annualDividend = quote?.annualDividend ?? quote?.trailingAnnualDividendRate ?? previous?.annualDividend;
          
          // Calculate annual dividend income (annual dividend per share * quantity)
          const annualDividendIncome = annualDividend && Number.isFinite(annualDividend) && annualDividend > 0
            ? annualDividend * investment.quantity
            : undefined;

          return {
            ...investment,
            currentPrice,
            changePercent,
            marketValue,
            dividendYield,
            annualDividend,
            annualDividendIncome,
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
      {/* Enhanced Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '800', 
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}>
            Investing Portfolio
          </Text>
          <Text style={{ 
            fontSize: 13, 
            color: '#94A3B8', 
            marginTop: 2,
            fontWeight: '500',
          }}>
            Stocks, ETFs, forex & managed strategies
          </Text>
        </View>
      </View>

      {/* Enhanced Metric Cards - Scaled Down */}
      <View
        style={{
          flexDirection: isWideLayout ? 'row' : 'column',
          justifyContent: isWideLayout ? 'space-between' : 'flex-start',
          marginBottom: 16,
          gap: 12,
        }}
      >
        {metricCards.map((card, index) => (
          <Animated.View
            key={card.id}
            entering={FadeInUp.delay(100 + index * 100)}
            exiting={FadeOutDown}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: `${card.accentColor}40`,
              padding: 16,
              flex: isWideLayout ? 1 : undefined,
              shadowColor: card.accentColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ 
              color: '#94A3B8', 
              fontSize: 11, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8,
            }}>
              {card.title}
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '800',
                marginBottom: 6,
                letterSpacing: -0.5,
              }}
            >
              {card.value}
            </Text>
            <Text
              style={{
                color: card.accentColor,
                fontSize: 12,
                marginTop: 2,
                fontWeight: '600',
              }}
            >
              {card.description}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Portfolio Analytics Section - Enhanced */}
      {portfolioMetrics && (
        <View
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: 'rgba(34, 197, 94, 0.3)',
            padding: 16,
            marginBottom: 16,
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ 
            color: '#94A3B8', 
            fontSize: 12, 
            fontWeight: '800', 
            letterSpacing: 0.5, 
            marginBottom: 12,
          }}>
            PORTFOLIO ANALYTICS
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ 
              flex: 1, 
              minWidth: '45%', 
              marginBottom: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 12,
              padding: 12,
            }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 10, 
                marginBottom: 6,
                fontWeight: '600',
              }}>
                Total Return
              </Text>
              <Text
                style={{
                  color: portfolioMetrics.metrics.totalReturn >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                {portfolioMetrics.metrics.totalReturn >= 0 ? '+' : ''}
                {formatLargeCurrency(portfolioMetrics.metrics.totalReturn)}
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
                backgroundColor: portfolioMetrics.metrics.totalReturnPercent >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: portfolioMetrics.metrics.totalReturnPercent >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              }}>
                <Ionicons 
                  name={portfolioMetrics.metrics.totalReturnPercent >= 0 ? "trending-up" : "trending-down"} 
                  size={12} 
                  color={portfolioMetrics.metrics.totalReturnPercent >= 0 ? '#22c55e' : '#ef4444'} 
                />
                <Text
                  style={{
                    color: portfolioMetrics.metrics.totalReturnPercent >= 0 ? '#22c55e' : '#ef4444',
                    fontSize: 12,
                    fontWeight: '700',
                    marginLeft: 4,
                  }}
                >
                  {portfolioMetrics.metrics.totalReturnPercent >= 0 ? '+' : ''}
                  {portfolioMetrics.metrics.totalReturnPercent.toFixed(2)}%
                </Text>
              </View>
              {/* Breakdown: Capital Gains + Dividends */}
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.15)' }}>
                <Text style={{ color: '#94A3B8', fontSize: 9, marginBottom: 4, fontWeight: '500' }}>
                  Capital: {portfolioMetrics.metrics.capitalGains >= 0 ? '+' : ''}
                  {formatLargeCurrency(portfolioMetrics.metrics.capitalGains)} ({portfolioMetrics.metrics.capitalGainsPercent >= 0 ? '+' : ''}
                  {portfolioMetrics.metrics.capitalGainsPercent.toFixed(2)}%)
                </Text>
                <Text style={{ 
                  color: portfolioMetrics.metrics.dividendIncome > 0 ? '#5EEAD4' : '#64748B', 
                  fontSize: 9, 
                  marginTop: 2,
                  fontWeight: '500',
                }}>
                  Dividends: {portfolioMetrics.metrics.dividendIncome > 0 ? '+' : ''}
                  {portfolioMetrics.metrics.dividendIncome > 0 
                    ? `${formatLargeCurrency(portfolioMetrics.metrics.dividendIncome)}/yr`
                    : '$0.00/yr (no data)'}
                </Text>
              </View>
            </View>

            <View style={{ 
              flex: 1, 
              minWidth: '45%', 
              marginBottom: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 12,
              padding: 12,
            }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 10, 
                marginBottom: 6,
                fontWeight: '600',
              }}>
                Diversification
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                {portfolioMetrics.diversification.effectiveHoldings.toFixed(1)} effective holdings
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}>
                <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>
                  Concentration: {(portfolioMetrics.diversification.concentration * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.15)' }}>
                <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 4, fontWeight: '600' }}>Dividend Yield</Text>
                {portfolioMetrics.metrics.dividendYield > 0 ? (
                  <>
                    <Text style={{ color: '#5EEAD4', fontSize: 16, fontWeight: '700' }}>
                      {portfolioMetrics.metrics.dividendYield.toFixed(2)}%
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 10, marginTop: 4, fontWeight: '500' }}>
                      Annual: {formatLargeCurrency(portfolioMetrics.metrics.dividendIncome)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>
                      N/A
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>
                      No dividend data
                    </Text>
                  </>
                )}
              </View>
            </View>

            {portfolioMetrics.holdingsPerformance.length > 0 && (
              <View style={{ 
                flex: 1, 
                minWidth: '100%', 
                marginTop: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ 
                  color: '#94A3B8', 
                  fontSize: 11, 
                  marginBottom: 10,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}>
                  TOP HOLDINGS BY WEIGHT
                </Text>
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
                        marginBottom: index < 2 ? 10 : 0,
                        paddingBottom: index < 2 ? 10 : 0,
                        borderBottomWidth: index < 2 ? 1 : 0,
                        borderBottomColor: 'rgba(148, 163, 184, 0.15)',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: '#FFFFFF', 
                          fontSize: 14, 
                          fontWeight: '700',
                          marginBottom: 4,
                        }}>
                          {holding.symbol}
                        </Text>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: holding.profitLossPercent >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 6,
                          alignSelf: 'flex-start',
                          borderWidth: 1,
                          borderColor: holding.profitLossPercent >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        }}>
                          <Ionicons 
                            name={holding.profitLossPercent >= 0 ? "trending-up" : "trending-down"} 
                            size={10} 
                            color={holding.profitLossPercent >= 0 ? '#22c55e' : '#ef4444'} 
                          />
                          <Text style={{ 
                            color: holding.profitLossPercent >= 0 ? '#22c55e' : '#ef4444', 
                            fontSize: 11,
                            fontWeight: '700',
                            marginLeft: 3,
                          }}>
                            {holding.profitLossPercent >= 0 ? '+' : ''}
                            {holding.profitLossPercent.toFixed(2)}% P&L
                          </Text>
                        </View>
                        {holding.annualDividendIncome && holding.annualDividendIncome > 0 && (
                          <Text style={{ color: '#5EEAD4', fontSize: 10, marginTop: 4, fontWeight: '600' }}>
                            {holding.dividendYield ? `${holding.dividendYield.toFixed(2)}% yield` : ''} • {formatLargeCurrency(holding.annualDividendIncome)}/yr
                          </Text>
                        )}
                      </View>
                      <View style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      }}>
                        <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '800' }}>
                          {holding.weight.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Holdings Title - Enhanced */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: 20, 
          fontWeight: '800',
          letterSpacing: -0.3,
        }}>
          Holdings
        </Text>
        <View style={{
          flexDirection: 'row',
          gap: 6,
        }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: filterType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: filterType === 'all' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(148, 163, 184, 0.2)',
            }}
            onPress={() => setFilterType('all')}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: filterType === 'all' ? '#3B82F6' : '#94A3B8',
            }}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHolding = ({ item, index }: { item: InvestmentHolding; index: number }) => {
    const isPositive = item.changePercent >= 0;
    const profitLoss = item.marketValue - (item.quantity * item.averagePrice);
    const profitLossPercent = item.quantity * item.averagePrice > 0 
      ? ((profitLoss / (item.quantity * item.averagePrice)) * 100) 
      : 0;
    
    return (
      <Animated.View
        entering={FadeInUp.delay(350 + index * 40)}
        style={{ marginBottom: 10 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectHolding(item)}
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.1)',
            padding: 14,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {item.icon ? (
                <Image
                  source={{ uri: item.icon }}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    marginRight: 12,
                    borderWidth: 1.5,
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    marginRight: 12,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 12 }}>
                    {item.symbol.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 16, 
                  fontWeight: '700',
                  marginBottom: 3,
                  letterSpacing: -0.2,
                }}>
                  {item.symbol}
                </Text>
                <Text style={{ 
                  color: '#94A3B8', 
                  fontSize: 12, 
                  marginTop: 2,
                  fontWeight: '500',
                }}>
                  {item.type.toUpperCase()} • {item.market}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          {/* Market Value and 24H Change - Enhanced */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            marginBottom: 12,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 11,
                marginBottom: 4,
                fontWeight: '600',
              }}>
                Market Value
              </Text>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '800',
                letterSpacing: -0.3,
              }}>
                {formatLargeCurrency(item.marketValue)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 11,
                marginBottom: 4,
                fontWeight: '600',
                textAlign: 'right',
              }}>
                24H Change
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              }}>
                <Ionicons 
                  name={isPositive ? "trending-up" : "trending-down"} 
                  size={12} 
                  color={isPositive ? '#22c55e' : '#ef4444'} 
                />
                <Text
                  style={{
                    color: isPositive ? '#22c55e' : '#ef4444',
                    fontSize: 13,
                    fontWeight: '700',
                    marginLeft: 4,
                  }}
                >
                  {isPositive ? '+' : ''}
                  {item.changePercent.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
          
          {/* P&L Display */}
          <View style={{
            backgroundColor: profitLoss >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: profitLoss >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>Total P&L</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={profitLoss >= 0 ? "trending-up" : "trending-down"} 
                  size={14} 
                  color={profitLoss >= 0 ? '#22c55e' : '#ef4444'} 
                />
                <Text style={{
                  color: profitLoss >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: 14,
                  fontWeight: '800',
                  marginLeft: 4,
                }}>
                  {profitLoss >= 0 ? '+' : ''}{formatLargeCurrency(profitLoss)}
                </Text>
                <Text style={{
                  color: profitLossPercent >= 0 ? '#22c55e' : '#ef4444',
                  fontSize: 12,
                  fontWeight: '700',
                  marginLeft: 8,
                }}>
                  ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Entry, Last, Quantity - Enhanced */}
          <View style={{ 
            flexDirection: 'row', 
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(148, 163, 184, 0.1)',
            gap: 8,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 10,
                marginBottom: 4,
                fontWeight: '600',
              }}>
                Entry Price
              </Text>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 13, 
                fontWeight: '700',
              }}>
                {formatLargeCurrency(item.averagePrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 10,
                marginBottom: 4,
                fontWeight: '600',
              }}>
                Current Price
              </Text>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 13, 
                fontWeight: '700',
              }}>
                {formatLargeCurrency(item.currentPrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: '#94A3B8', 
                fontSize: 10,
                marginBottom: 4,
                fontWeight: '600',
              }}>
                Quantity
              </Text>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 13, 
                fontWeight: '700',
              }}>
                {item.quantity.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Dividend Information - Enhanced */}
          {item.annualDividendIncome && item.annualDividendIncome > 0 && (
            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: 'rgba(94, 234, 212, 0.2)',
              backgroundColor: 'rgba(94, 234, 212, 0.08)',
              borderRadius: 10,
              padding: 10,
            }}>
              <Text style={{
                color: '#5EEAD4',
                fontSize: 11,
                fontWeight: '700',
                marginBottom: 8,
                letterSpacing: 0.5,
              }}>
                DIVIDEND INFORMATION
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: '#94A3B8', 
                    fontSize: 10,
                    marginBottom: 4,
                    fontWeight: '600',
                  }}>
                    Yield
                  </Text>
                  <Text style={{ 
                    color: '#5EEAD4', 
                    fontSize: 14, 
                    fontWeight: '800',
                  }}>
                    {item.dividendYield ? `${item.dividendYield.toFixed(2)}%` : 'N/A'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: '#94A3B8', 
                    fontSize: 10,
                    marginBottom: 4,
                    fontWeight: '600',
                  }}>
                    Annual Income
                  </Text>
                  <Text style={{ 
                    color: '#5EEAD4', 
                    fontSize: 14, 
                    fontWeight: '800',
                  }}>
                    {formatLargeCurrency(item.annualDividendIncome)}
                  </Text>
                </View>
                {item.annualDividend && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#94A3B8', 
                      fontSize: 10,
                      marginBottom: 4,
                      fontWeight: '600',
                    }}>
                      Per Share
                    </Text>
                    <Text style={{ 
                      color: '#5EEAD4', 
                      fontSize: 14, 
                      fontWeight: '800',
                    }}>
                      {formatLargeCurrency(item.annualDividend)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    }}>
      <View style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
      }}>
        <Ionicons name="trending-up-outline" size={32} color="#94A3B8" />
      </View>
      <Text style={{
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        No Holdings Found
      </Text>
      <Text style={{
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
      }}>
        Your investment portfolio will appear here once you add holdings.
      </Text>
    </View>
  );

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={holdings}
          keyExtractor={(item) => item.id}
          renderItem={renderHolding}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ 
            padding: 16, 
            paddingBottom: 32,
            flexGrow: holdings.length === 0 ? 1 : 0,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </SafeAreaView>
    </UniversalBackground>
  );
};
