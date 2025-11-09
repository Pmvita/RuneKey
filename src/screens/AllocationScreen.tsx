import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const { width: screenWidth } = Dimensions.get('window');

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
    try {
      const result = await priceService.fetchMarketData(20);
      if (result.success && result.data) {
        setMarketData(result.data);
      } else {
        // Use fallback data if API fails
        console.log('⚠️ Using fallback market data due to API failure');
        setMarketData([
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            current_price: 51200,
            market_cap: 1000000000000,
            market_cap_rank: 1,
            total_volume: 25000000000,
            high_24h: 52000,
            low_24h: 50000,
            price_change_24h: 1200,
            price_change_percentage_24h: 2.4,
            market_cap_change_24h: 24000000000,
            market_cap_change_percentage_24h: 2.4,
            circulating_supply: 19500000,
            total_supply: 21000000,
            max_supply: 21000000,
            ath: 69000,
            ath_change_percentage: -25.8,
            ath_date: '2021-11-10T14:24:11.849Z',
            atl: 67.81,
            atl_change_percentage: 75400.0,
            atl_date: '2013-07-06T00:00:00.000Z',
            last_updated: new Date().toISOString(),
          },
          {
            id: 'ethereum',
            symbol: 'eth',
            name: 'Ethereum',
            image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            current_price: 3200,
            market_cap: 400000000000,
            market_cap_rank: 2,
            total_volume: 15000000000,
            high_24h: 3300,
            low_24h: 3100,
            price_change_24h: 100,
            price_change_percentage_24h: 3.2,
            market_cap_change_24h: 12000000000,
            market_cap_change_percentage_24h: 3.2,
            circulating_supply: 120000000,
            total_supply: 120000000,
            max_supply: 0,
            ath: 4800,
            ath_change_percentage: -33.3,
            ath_date: '2021-11-10T14:24:11.849Z',
            atl: 0.432979,
            atl_change_percentage: 740000.0,
            atl_date: '2015-10-20T00:00:00.000Z',
            last_updated: new Date().toISOString(),
          },
          {
            id: 'ripple',
            symbol: 'xrp',
            name: 'XRP',
            image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
            current_price: 0.52,
            market_cap: 28000000000,
            market_cap_rank: 6,
            total_volume: 2000000000,
            high_24h: 0.53,
            low_24h: 0.51,
            price_change_24h: 0.01,
            price_change_percentage_24h: 1.96,
            market_cap_change_24h: 500000000,
            market_cap_change_percentage_24h: 1.96,
            circulating_supply: 54000000000,
            total_supply: 100000000000,
            max_supply: 100000000000,
            ath: 3.40,
            ath_change_percentage: -84.7,
            ath_date: '2018-01-07T00:00:00.000Z',
            atl: 0.00268621,
            atl_change_percentage: 19200.0,
            atl_date: '2014-05-22T00:00:00.000Z',
            last_updated: new Date().toISOString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
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
        // Handle balance conversion - dev wallet has raw token amounts
        let balance = parseFloat(token.balance || '0');
        
        // For dev wallet, the balances are already in the correct units
        // BTC: 40000 = 0.0004 BTC (divide by 100000000 for 8 decimals)
        // ETH: 220000 = 0.00022 ETH (divide by 1000000000000000000 for 18 decimals)
        // XRP: 100500000 = 100.5 XRP (divide by 1000000 for 6 decimals)
        
        if (token.symbol === 'BTC') {
          balance = balance / Math.pow(10, 8); // 8 decimals
        } else if (token.symbol === 'ETH') {
          balance = balance / Math.pow(10, 18); // 18 decimals
        } else if (token.symbol === 'XRP') {
          balance = balance / Math.pow(10, 6); // 6 decimals
        } else if (token.symbol === 'SOL') {
          balance = balance / Math.pow(10, 9); // 9 decimals
        } else if (token.symbol === 'USDT' || token.symbol === 'USDC') {
          balance = balance / Math.pow(10, 6); // 6 decimals
        } else {
          // Default to 18 decimals for other tokens
          balance = balance / Math.pow(10, 18);
        }
        
        const price = token.currentPrice || 0;
        const usdValue = balance * price;
        
        console.log(`🔍 AllocationScreen: ${token.symbol} - Raw Balance: ${token.balance}, Adjusted Balance: ${balance}, Price: ${price}, USD Value: ${usdValue}`);
        
        return {
          token: {
            ...token,
            balance: balance.toString(), // Update token with adjusted balance
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
          backgroundColor: '#111827',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
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

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Donut Chart Section */}
        <Animated.View style={[{
          alignItems: 'center',
          paddingVertical: 60,
          backgroundColor: '#111827',
          marginBottom: 20,
          marginTop: 20,
        }, chartAnimatedStyle]}>
          <DonutChart data={allocationData} size={220} />
        </Animated.View>

        {/* Asset List Section */}
        <Animated.View style={[{
          paddingHorizontal: 20,
          paddingBottom: 20,
        }, listAnimatedStyle]}>
          {allocationData.length > 0 ? (
            allocationData.map((item, index) => (
              <AssetListItem key={index} item={item} index={index} />
            ))
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
              backgroundColor: '#111827',
              borderRadius: 12,
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
          )}
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};
