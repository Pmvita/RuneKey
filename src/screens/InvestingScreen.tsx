import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import investingData from '../../mockData/investing.json';
import { Investment, InvestmentHolding } from '../types';
import { formatLargeCurrency } from '../utils/formatters';
import { investingService } from '../services/api/investingService';
import { usePrices } from '../hooks/token/usePrices';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { UniversalBackground } from '../components';

const investments: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

export const InvestingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentWallet } = useWalletStore();
  const { getTokenPrice } = usePrices();
  const { width: screenWidth } = useWindowDimensions();
  const isWideLayout = screenWidth >= 720;
  const metricValueFontSize = isWideLayout ? 24 : 20;
  const metricSubtitleFontSize = isWideLayout ? 13 : 12;
  const metricDescriptionFontSize = isWideLayout ? 14 : 13;
  const metricCardVerticalPadding = isWideLayout ? 24 : 20;

  const [holdings, setHoldings] = useState<InvestmentHolding[]>(() =>
    investments.map((investment) => ({
      ...investment,
      currentPrice: investment.mockPrice || investment.averagePrice,
      changePercent: 0,
      marketValue: investment.quantity * (investment.mockPrice || investment.averagePrice),
    }))
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

  const loadQuotes = useCallback(async () => {
    if (investments.length === 0) {
      return;
    }

    const symbols = investments.map((investment) => investment.symbol.toUpperCase());
    const response = await investingService.fetchQuotes(symbols);
    const quotes = response.data || {};

    setHoldings(
      investments.map((investment) => {
        const symbol = investment.symbol.toUpperCase();
        const quote = quotes[symbol];
        const currentPrice = quote?.price || investment.mockPrice || investment.averagePrice;
        const changePercent = quote?.changePercent ?? 0;
        const marketValue = investment.quantity * currentPrice;

        return {
          ...investment,
          currentPrice,
          changePercent,
          marketValue,
        };
      })
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
        title: 'TOTAL INVESTMENT (COST BASIS)',
        value: formatLargeCurrency(totalInvestmentCost),
        description: 'Sum of allocations across strategies',
        accentColor: '#38BDF8',
      },
      {
        id: 'market-value',
        title: 'CURRENT MARKET VALUE',
        value: formatLargeCurrency(totalMarketValue),
        description: 'Updated using live Yahoo Finance quotes',
        accentColor: '#F97316',
      },
    ],
    [activeCapitalValue, totalInvestmentCost, totalMarketValue]
  );

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              tintColor="#3B82F6"
              colors={['#3B82F6']}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        >
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

          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
            Holdings overview
          </Text>

          {holdings.map((holding, index) => {
            const isPositive = holding.changePercent >= 0;
            return (
              <Animated.View
                key={holding.id}
                entering={FadeInUp.delay(350 + index * 40)}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(30, 41, 59, 0.55)',
                  padding: 18,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{holding.name}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                      {holding.symbol} • {holding.type.toUpperCase()} • {holding.market}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                      {formatLargeCurrency(holding.marketValue)}
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
                      {holding.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>Quantity</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                      {holding.quantity.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>Entry</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                      {formatLargeCurrency(holding.averagePrice)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                      {formatLargeCurrency(holding.currentPrice)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};
