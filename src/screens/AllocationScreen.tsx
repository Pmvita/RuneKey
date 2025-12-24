import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { usePrices } from '../hooks/token/usePrices';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { Token } from '../types';
import { formatCurrency, formatLargeCurrency } from '../utils/formatters';
import { UniversalBackground, CustomLoadingAnimation } from '../components';
import { useNavigation } from '@react-navigation/native';
import { priceService, CoinInfo } from '../services/api/priceService';
import topCoinsMock from '../../mockData/api/top-coins.json';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AllocationData {
  token: Token;
  percentage: number;
  usdValue: number;
  color: string;
}

export const AllocationScreen: React.FC = () => {
  const { currentWallet, isConnected } = useWalletStore();
  const { calculateUSDValue, getTokenPrice } = usePrices();
  const { connectDevWallet, refreshDevWallet } = useDevWallet();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [marketData, setMarketData] = useState<CoinInfo[]>([]);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const chartScale = useSharedValue(0.8);
  const chartOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(50);
  const listOpacity = useSharedValue(0);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    transform: [{ scale: chartScale.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  // Color palette for the donut chart
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
  ];

  // Load market data from CoinGecko
  const loadMarketData = async () => {
    const applyMockMarketData = () => {
      const fallbackData = (topCoinsMock as CoinInfo[]).map((coin) => ({
        ...coin,
        last_updated: coin.last_updated || new Date().toISOString(),
      }));
      setMarketData(fallbackData);
    };

    try {
      const result = await priceService.fetchMarketData(20);
      if (result.success && result.data) {
        setMarketData(result.data);
      } else {
        applyMockMarketData();
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
      applyMockMarketData();
    }
  };

  // Memoized fallback prices - prevent recreation on every render
  const fallbackPrices = useMemo(() => ({
    'BTC': 51200,
    'ETH': 3200,
    'XRP': 0.52,
    'SOL': 95,
    'USDT': 1.00,
    'USDC': 1.00,
    'BNB': 320,
    'DOGE': 0.08,
    'ADA': 0.45,
    'TRX': 0.12,
  }), []);

  // Memoized filtered market data - only recalculates when dependencies change
  const filteredMarketData = useMemo(() => {
    if (!currentWallet?.tokens) {
      return [];
    }

    return currentWallet.tokens.map(token => {
      // Find matching market data
      const marketToken = marketData.find(m => 
        m.symbol.toLowerCase() === token.symbol.toLowerCase() ||
        m.id === token.coinId
      );

      // Use market price, fallback price, or 0
      const currentPrice = marketToken?.current_price || fallbackPrices[token.symbol] || 0;

      return {
        ...token,
        currentPrice,
        priceChange24h: marketToken?.price_change_percentage_24h || 0,
        marketCap: marketToken?.market_cap || 0,
        logoURI: marketToken?.image || token.logoURI,
      };
    });
  }, [currentWallet?.tokens, marketData, fallbackPrices]);

  // Get filtered market data (wrapper for backward compatibility)
  const getFilteredMarketData = useCallback(() => filteredMarketData, [filteredMarketData]);

  // Calculate allocation data
  const calculateAllocations = useCallback(async () => {
    if (!currentWallet?.tokens) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get filtered market data (use memoized version)
      const filteredTokens = filteredMarketData;
      
      // Calculate USD values for all tokens
      const tokensWithValues = filteredTokens.map((token) => {
        const balance = parseFloat(token.balance || '0') || 0;
        const price = token.currentPrice && token.currentPrice > 0
          ? token.currentPrice
          : (token.usdValue && balance > 0 ? token.usdValue / balance : 0);
        const usdValue = token.usdValue && token.usdValue > 0
          ? token.usdValue
          : balance * price;

        return {
          token: {
            ...token,
            balance: balance.toString(),
            currentPrice: price,
            usdValue,
          },
          balance,
          price,
          usdValue,
        };
      });

      // Filter out tokens with zero value and sort by USD value
      const validTokens = tokensWithValues
        .filter(item => item.usdValue > 0)
        .sort((a, b) => b.usdValue - a.usdValue);

      // Calculate total portfolio value
      const total = validTokens.reduce((sum, item) => sum + item.usdValue, 0);
      setTotalValue(total);

      // Calculate percentages and create allocation data
      const allocations: AllocationData[] = validTokens.map((item, index) => ({
        token: item.token,
        percentage: total > 0 ? (item.usdValue / total) * 100 : 0,
        usdValue: item.usdValue,
        color: colors[index % colors.length],
      }));

      setAllocationData(allocations);
    } catch (error) {
      console.error('Error calculating allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, marketData]);

  // Auto-connect dev wallet if not connected
  useEffect(() => {
    // Only connect if we don't have a wallet and we're not already connecting
    if (!currentWallet && !isConnectingWallet) {
      setIsConnectingWallet(true);
      connectDevWallet().finally(() => {
        setIsConnectingWallet(false);
      });
    }
  }, [currentWallet, connectDevWallet, isConnectingWallet]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadMarketData();
        if (currentWallet?.id === 'developer-wallet') {
          await refreshDevWallet(); // Refresh wallet data with live prices
        }
        calculateAllocations();
      };
      loadData();
    }, [calculateAllocations, refreshDevWallet, currentWallet])
  );

  // Trigger animations
  useEffect(() => {
    const timer = setTimeout(() => {
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withSpring(0, { damping: 15 });
      
      chartScale.value = withDelay(200, withSpring(1, { damping: 12 }));
      chartOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      
      listTranslateY.value = withDelay(400, withSpring(0, { damping: 15 }));
      listOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Donut Chart Component - Enhanced
  const DonutChart = ({ data, size = 180 }: { data: AllocationData[], size?: number }) => {
    const radius = (size - 40) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercentage = 0;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G>
            {data.map((item, index) => {
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
              const rotation = (cumulativePercentage / 100) * 360;
              
              cumulativePercentage += item.percentage;
              
              return (
                <Circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} ${centerX} ${centerY})`}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        
        {/* Center content - Enhanced */}
        <View style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -0.5,
          }}>
            {data.length}
          </Text>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#94A3B8',
            marginTop: 2,
          }}>
            assets
          </Text>
        </View>
      </View>
    );
  };

  // Asset List Item Component - Enhanced
  const AssetListItem = ({ item, index }: { item: AllocationData, index: number }) => {
    const balance = parseFloat(item.token.balance || '0');
    const formattedBalance = balance < 1 
      ? balance.toFixed(6) 
      : balance < 1000 
        ? balance.toFixed(4) 
        : balance.toFixed(2);
    
    const priceChange = item.token.priceChange24h || 0;
    const isPositive = priceChange >= 0;

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
      }}>
        {/* Token Icon - Enhanced */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          borderWidth: 2,
          borderColor: item.color,
        }}>
          {item.token.logoURI ? (
            <Image
              source={{ uri: item.token.logoURI }}
              style={{ width: 30, height: 30, borderRadius: 15 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '700',
            }}>
              {item.token.symbol.charAt(0)}
            </Text>
          )}
        </View>

        {/* Token Info - Enhanced */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 3,
            letterSpacing: -0.2,
          }}>
            {item.token.symbol}
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#94A3B8',
            fontWeight: '500',
          }}>
            {formattedBalance} {item.token.symbol}
          </Text>
        </View>

        {/* Percentage and Value - Enhanced */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 3,
            letterSpacing: -0.2,
          }}>
            {item.percentage.toFixed(1)}%
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#94A3B8',
            fontWeight: '600',
            marginBottom: 2,
          }}>
            {item.usdValue >= 1000000 
              ? formatLargeCurrency(item.usdValue)
              : formatCurrency(item.usdValue)
            }
          </Text>
          {priceChange !== 0 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }}>
              <Ionicons 
                name={isPositive ? "trending-up" : "trending-down"} 
                size={10} 
                color={isPositive ? '#22c55e' : '#ef4444'} 
              />
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: isPositive ? '#22c55e' : '#ef4444',
                marginLeft: 2,
              }}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar - Enhanced */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2.5,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}>
          <View style={{
            height: '100%',
            width: `${item.percentage}%`,
            backgroundColor: item.color,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: item.percentage === 100 ? 16 : 0,
          }} />
        </View>
      </View>
    );
  };

const EmptyAllocationsState = () => (
  <View style={{
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  }}>
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(148, 163, 184, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    }}>
      <Ionicons name="wallet-outline" size={36} color="#94A3B8" />
    </View>
    <Text style={{
      marginTop: 4,
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '700',
      marginBottom: 6,
    }}>
      No crypto assets found
    </Text>
    <Text style={{
      fontSize: 13,
      color: '#94A3B8',
      textAlign: 'center',
      fontWeight: '500',
    }}>
      Connect your wallet to view asset allocation
    </Text>
  </View>
);

  if (isLoading || isConnectingWallet) {
    return (
      <UniversalBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <CustomLoadingAnimation
            message={isConnectingWallet ? 'Connecting wallet...' : 'Loading crypto portfolio...'}
            size="large"
            variant="fullscreen"
          />
        </SafeAreaView>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - Enhanced */}
        <Animated.View style={[{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16, 
          paddingTop: 12,
          paddingBottom: 8,
        }, headerAnimatedStyle]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}>
              Crypto Portfolio
            </Text>
            <Text style={{
              fontSize: 13,
              color: '#94A3B8',
              marginTop: 2,
              fontWeight: '500',
            }}>
              Asset allocation breakdown
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
          <FlatList
            data={allocationData}
            keyExtractor={(item, index) => 
              item.token.address 
                ? `${item.token.address}-${index}` 
                : `${item.token.symbol}-${index}`
            }
            renderItem={({ item, index }) => (
              <AssetListItem item={item} index={index} />
            )}
            ListHeaderComponent={
              <Animated.View style={[{
                alignItems: 'center',
                paddingTop: 20,
                paddingBottom: 24,
                marginBottom: 16,
              }, chartAnimatedStyle]}>
                {/* Total Portfolio Value */}
                <View style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                  width: '100%',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#94A3B8',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}>
                    TOTAL PORTFOLIO VALUE
                  </Text>
                  <Text style={{
                    fontSize: 36,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    letterSpacing: -1,
                  }}>
                    {formatLargeCurrency(totalValue)}
                  </Text>
                </View>
                
                {/* Donut Chart */}
                <DonutChart data={allocationData} size={180} />
              </Animated.View>
            }
            ListEmptyComponent={<EmptyAllocationsState />}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 32 + insets.bottom,
              minHeight: Math.max(screenHeight - (insets.top + insets.bottom), 0),
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      </SafeAreaView>
    </UniversalBackground>
  );
};
