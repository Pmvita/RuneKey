import React, { useState, useEffect, useCallback } from 'react';
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
import { UniversalBackground } from '../components';
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

  // Get filtered market data (combines wallet tokens with market data)
  const getFilteredMarketData = () => {
    if (!currentWallet?.tokens) {
      return [];
    }

    // Fallback prices for common tokens
    const fallbackPrices: { [key: string]: number } = {
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
    };

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
  };

  // Calculate allocation data
  const calculateAllocations = useCallback(async () => {
    if (!currentWallet?.tokens) {
      console.log('🔍 AllocationScreen: No currentWallet or tokens');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get filtered market data
      const filteredTokens = getFilteredMarketData();
      console.log('🔍 AllocationScreen: Filtered tokens:', filteredTokens.length);
      
      // Calculate USD values for all tokens
      const tokensWithValues = filteredTokens.map((token) => {
        const balance = parseFloat(token.balance || '0') || 0;
        const price = token.currentPrice && token.currentPrice > 0
          ? token.currentPrice
          : (token.usdValue && balance > 0 ? token.usdValue / balance : 0);
        const usdValue = token.usdValue && token.usdValue > 0
          ? token.usdValue
          : balance * price;

        console.log(`🔍 AllocationScreen: ${token.symbol} - Balance: ${token.balance}, Price: ${price}, USD Value: ${usdValue}`);

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

      console.log('🔍 AllocationScreen: Valid tokens with value > 0:', validTokens.length);

      // Calculate total portfolio value
      const total = validTokens.reduce((sum, item) => sum + item.usdValue, 0);
      setTotalValue(total);
      console.log('🔍 AllocationScreen: Total portfolio value:', total);

      // Calculate percentages and create allocation data
      const allocations: AllocationData[] = validTokens.map((item, index) => ({
        token: item.token,
        percentage: total > 0 ? (item.usdValue / total) * 100 : 0,
        usdValue: item.usdValue,
        color: colors[index % colors.length],
      }));

      console.log('🔍 AllocationScreen: Final allocations:', allocations);
      setAllocationData(allocations);
    } catch (error) {
      console.error('Error calculating allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, marketData]);

  // Auto-connect dev wallet if not connected
  useEffect(() => {
    console.log('🔍 AllocationScreen: isConnected =', isConnected, 'currentWallet =', currentWallet ? 'exists' : 'null');
    
    // Only connect if we don't have a wallet and we're not already connecting
    if (!currentWallet && !isConnectingWallet) {
      console.log('🔄 Connecting Dev Wallet for AllocationScreen...');
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

  // Donut Chart Component
  const DonutChart = ({ data, size = 220 }: { data: AllocationData[], size?: number }) => {
    const radius = (size - 50) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const strokeWidth = 24;
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
        
        {/* Center content */}
        <View style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}>
            {data.length}
          </Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#94A3B8',
            marginTop: 2,
          }}>
            assets
          </Text>
        </View>
      </View>
    );
  };

  // Asset List Item Component
  const AssetListItem = ({ item, index }: { item: AllocationData, index: number }) => {
    const balance = parseFloat(item.token.balance || '0');
    const formattedBalance = balance < 1 
      ? balance.toFixed(6) 
      : balance < 1000 
        ? balance.toFixed(4) 
        : balance.toFixed(2);

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#111827',
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
        {/* Token Icon */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: item.color,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          {item.token.logoURI ? (
            <Image
              source={{ uri: item.token.logoURI }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              {item.token.symbol.charAt(0)}
            </Text>
          )}
        </View>

        {/* Token Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 2,
          }}>
            {item.token.name}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#94A3B8',
          }}>
            {formattedBalance} {item.token.symbol}
          </Text>
        </View>

        {/* Percentage and Value */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 2,
          }}>
            {item.percentage.toFixed(2)}%
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#94A3B8',
          }}>
            {item.usdValue >= 1000000 
              ? formatLargeCurrency(item.usdValue)
              : formatCurrency(item.usdValue)
            }
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#0b1120',
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}>
          <View style={{
            height: '100%',
            width: `${item.percentage}%`,
            backgroundColor: item.color,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: item.percentage === 100 ? 12 : 0,
          }} />
        </View>
      </View>
    );
  };

const EmptyAllocationsState = () => (
  <View style={{
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginTop: 12,
  }}>
    <Ionicons name="wallet-outline" size={48} color="#94A3B8" />
    <Text style={{
      marginTop: 16,
      fontSize: 16,
      color: '#94A3B8',
      fontWeight: '500',
    }}>
      No assets found
    </Text>
    <Text style={{
      marginTop: 8,
      fontSize: 14,
      color: '#94a3b8',
      textAlign: 'center',
    }}>
      Connect your wallet to view asset allocation
    </Text>
  </View>
);

  if (isLoading || isConnectingWallet) {
    return (
      <UniversalBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 3,
              borderColor: '#3b82f6',
              borderTopColor: 'transparent',
            }} />
            <Text style={{
              marginTop: 16,
              fontSize: 16,
              color: '#94A3B8',
              fontWeight: '500',
            }}>
              {isConnectingWallet ? 'Connecting wallet...' : 'Loading allocation data...'}
            </Text>
          </View>
        </SafeAreaView>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View style={[{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 20, 
          paddingVertical: 16,
        }, headerAnimatedStyle]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#FFFFFF',
            flex: 1,
          }}>
            Allocation
          </Text>
        </Animated.View>

        <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
          <FlatList
            data={allocationData}
            keyExtractor={(item, index) => `${item.token.symbol}-${index}`}
            renderItem={({ item, index }) => (
              <AssetListItem item={item} index={index} />
            )}
            ListHeaderComponent={
              <Animated.View style={[{
                alignItems: 'center',
                paddingTop: 30,
                paddingBottom: 40,
                marginBottom: 12,
              }, chartAnimatedStyle]}>
                <DonutChart data={allocationData} size={220} />
              </Animated.View>
            }
            ListEmptyComponent={<EmptyAllocationsState />}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 40 + insets.bottom,
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
