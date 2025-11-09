import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { UniversalBackground, LiquidGlass, LoadingSpinner } from '../components';
import { priceService } from '../services/api/priceService';
import { logger } from '../utils/logger';
import { Token, RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  NormalizedTrendingToken,
  mapTrendingResponse,
  createFallbackTrendingTokens,
  mergeCoinInfoWithTrending,
} from '../utils/trending';

type TrendingTokensNavigationProp = StackNavigationProp<RootStackParamList, 'TrendingTokens'>;

export const TrendingTokensScreen: React.FC = () => {
  const navigation = useNavigation<TrendingTokensNavigationProp>();
  const [trendingTokens, setTrendingTokens] = useState<NormalizedTrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await priceService.fetchTrendingTokens();
      if (result.success && result.data.length > 0) {
        const normalized = mapTrendingResponse(result.data);
        let enriched = normalized;

        try {
          const marketResponse = await priceService.fetchMarketDataByIds(
            normalized.map((token) => token.id).filter(Boolean)
          );
          if (marketResponse.success && marketResponse.data.length > 0) {
            enriched = mergeCoinInfoWithTrending(normalized, marketResponse.data);
          }
        } catch (marketError) {
          console.warn('TrendingTokensScreen: Unable to enrich trending tokens with market data', marketError);
        }

        setTrendingTokens(enriched);
      } else {
        console.warn('TrendingTokensScreen: Using fallback trending tokens data');
        setTrendingTokens(createFallbackTrendingTokens());
      }
    } catch (error) {
      logger.logError('TrendingTokensScreen', error);
      setTrendingTokens(createFallbackTrendingTokens());
    } finally {
      setLastUpdated(new Date());
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) {
      return '$0.00';
    }

    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }

    const minimumFractionDigits = Math.abs(value) < 1 ? 4 : 2;
    const maximumFractionDigits = Math.abs(value) < 1 ? 4 : 2;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  };

  const formatPriceChange = (change: number) => {
    if (!Number.isFinite(change)) {
      return { value: '0.00', color: '#94A3B8', icon: 'remove' as const };
    }
    const isPositive = change >= 0;
    return {
      value: Math.abs(change).toFixed(2),
      color: isPositive ? '#22C55E' : '#EF4444',
      icon: isPositive ? ('trending-up' as const) : ('trending-down' as const),
    };
  };

  const buildTokenForDetails = (token: NormalizedTrendingToken): Token => ({
    address: token.id || `token-${token.symbol}`,
    symbol: token.symbol?.toUpperCase?.() || 'TOKEN',
    name: token.name || token.symbol?.toUpperCase?.() || 'Token',
    decimals: 18,
    logoURI: token.image,
    price: token.current_price ?? 0,
    priceChange24h: token.price_change_percentage_24h ?? 0,
  });

  const handleTokenPress = (token: NormalizedTrendingToken) => {
    logger.logButtonPress('TrendingTokensScreen', `token-${token.id}`);
    const builtToken = buildTokenForDetails(token);
    navigation.navigate('TokenDetails', { token: builtToken });
  };

  return (
    <UniversalBackground>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#E2E8F0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trending Tokens</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchTrending}
            disabled={isLoading}
            activeOpacity={0.75}
          >
            {isLoading ? (
              <LoadingSpinner size={16} color="#0F172A" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.refreshText}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <LiquidGlass variant="transparent" cornerRadius={24} elasticity={0.18} className="p-6" style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.updatedText}>
              Updated {lastUpdated ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago` : 'just now'}
            </Text>
          </View>

          {isLoading && trendingTokens.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={32} color="#3B82F6" />
              <Text style={styles.loadingLabel}>Pulling latest movers...</Text>
            </View>
          ) : (
            <FlatList
              data={trendingTokens}
              keyExtractor={(item, index) => item.id || `${item.symbol}-${index}`}
              contentContainerStyle={{ paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const priceChange = formatPriceChange(item.price_change_percentage_24h ?? 0);
                return (
                  <TouchableOpacity style={styles.row} onPress={() => handleTokenPress(item)} activeOpacity={0.75}>
                    <View style={styles.tokenMeta}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.tokenImage} />
                      ) : (
                        <View style={styles.tokenPlaceholder}>
                          <Ionicons name="ellipse" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View>
                        <Text style={styles.tokenName}>{item.name}</Text>
                        <Text style={styles.tokenSymbol}>#{item.market_cap_rank ?? '-'} • {item.symbol?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.tokenMetrics}>
                      <Text style={styles.tokenPrice}>{formatCurrency(item.current_price ?? 0)}</Text>
                      <View style={styles.tokenChangeRow}>
                        <Ionicons name={priceChange.icon} size={14} color={priceChange.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.tokenChangeText, { color: priceChange.color }]}>
                          {priceChange.value}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </LiquidGlass>
      </View>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  listCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  listHeader: {
    marginBottom: 16,
  },
  updatedText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  loadingLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  tokenMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenSymbol: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  tokenMetrics: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
});

export default TrendingTokensScreen;

