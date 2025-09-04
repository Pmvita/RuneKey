import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
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
import { Card } from '../components/common/Card';
import { TokenListItem } from '../components/token/TokenListItem';
import { 
  AnimatedNumber, 
  AnimatedPriceChange, 
  PortfolioSkeleton, 
  TokenSkeleton,
  AnimatedButton,
  ParticleEffect,
  AnimatedProgressBar,
  LiquidGlass,
  SparklineChart,
} from '../components';
import { useWallet } from '../hooks/wallet/useWallet';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { priceService, CoinInfo } from '../services/api/priceService';
import { logger } from '../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

type AssetFilter = 'all' | 'gainer' | 'loser' | 'favourites';

export const HomeScreen: React.FC = () => {
  const { isConnected, currentWallet, activeNetwork } = useWallet();
  const { connectDevWallet } = useDevWallet();
  const { 
    fetchPrices, 
    startPriceRefresh, 
    stopPriceRefresh, 
    isLoading: isLoadingPrices,
    getTokenPrice,
    getTokenPriceChange,
    calculateUSDValue
  } = usePrices();
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [marketData, setMarketData] = useState<CoinInfo[]>([]);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<AssetFilter>('all');
  const navigation = useNavigation<any>();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const portfolioScale = useSharedValue(0.8);
  const portfolioOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(50);
  const actionsOpacity = useSharedValue(0);
  const assetsTranslateY = useSharedValue(50);
  const assetsOpacity = useSharedValue(0);

  // Load mock data for development
  const loadWalletData = async () => {
    setLoadingData(true);
    try {
      // Import the mock data directly
      const mockData = require('../../mockData/api/dev-wallet.json');
      console.log('📊 HomeScreen: Loading Dev Mode Wallet mockData...');
      setWalletData(mockData.wallet);
      logger.logButtonPress('HomeScreen', 'load mock wallet data');
    } catch (error) {
      logger.logError('HomeScreen', 'Failed to load wallet data');
      console.error('Failed to load wallet data:', error);
      // Set fallback data for development
      setWalletData({
        totalValue: 21013534,
        tokens: [
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '5000000.00',
            usdValue: 5000000,
            priceChange24h: 0,
            logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441abb619d3d5c9c5c27da6e6f4d91.png',
            address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
            decimals: 6
          },
          {
            symbol: 'BNB',
            name: 'BNB',
            balance: '15000.00',
            usdValue: 4686750,
            priceChange24h: 0.79,
            logoURI: 'https://tokens.1inch.io/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
            address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
            decimals: 18
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '1250.875',
            usdValue: 4301083.65,
            priceChange24h: -2.39,
            logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18
          }
        ]
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Load market data from CoinGecko
  const loadMarketData = async () => {
    setLoadingMarketData(true);
    try {
      const result = await priceService.fetchMarketData(20);
      if (result.success && result.data) {
        setMarketData(result.data);
        logger.logButtonPress('HomeScreen', 'load market data');
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
      // Set fallback market data
      setMarketData([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          current_price: 2509.75,
          market_cap: 500000000000,
          market_cap_rank: 1,
          total_volume: 25000000000,
          high_24h: 2600,
          low_24h: 2400,
          price_change_24h: 225.75,
          price_change_percentage_24h: 9.77,
          market_cap_change_24h: 45000000000,
          market_cap_change_percentage_24h: 9.77,
          circulating_supply: 19500000,
          total_supply: 21000000,
          max_supply: 21000000,
          ath: 69000,
          ath_change_percentage: -63.6,
          ath_date: '2021-11-10T14:24:11.849Z',
          atl: 67.81,
          atl_change_percentage: 3600.0,
          atl_date: '2013-07-06T00:00:00.000Z',
          last_updated: new Date().toISOString(),
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          current_price: 2509.75,
          market_cap: 300000000000,
          market_cap_rank: 2,
          total_volume: 15000000000,
          high_24h: 2800,
          low_24h: 2400,
          price_change_24h: -525.25,
          price_change_percentage_24h: -21.00,
          market_cap_change_24h: -80000000000,
          market_cap_change_percentage_24h: -21.00,
          circulating_supply: 120000000,
          total_supply: 120000000,
          max_supply: null,
          ath: 4800,
          ath_change_percentage: -47.7,
          ath_date: '2021-11-10T14:24:11.849Z',
          atl: 0.432979,
          atl_change_percentage: 580000.0,
          atl_date: '2015-10-20T00:00:00.000Z',
          last_updated: new Date().toISOString(),
        },
        {
          id: 'band-protocol',
          symbol: 'band',
          name: 'Band Protocol',
          image: 'https://assets.coingecko.com/coins/images/9545/large/band-protocol.png',
          current_price: 553.06,
          market_cap: 5000000000,
          market_cap_rank: 50,
          total_volume: 50000000,
          high_24h: 600,
          low_24h: 500,
          price_change_24h: -165.94,
          price_change_percentage_24h: -22.97,
          market_cap_change_24h: -1500000000,
          market_cap_change_percentage_24h: -22.97,
          circulating_supply: 9000000,
          total_supply: 100000000,
          max_supply: 100000000,
          ath: 2000,
          ath_change_percentage: -72.3,
          ath_date: '2021-04-15T00:00:00.000Z',
          atl: 0.2,
          atl_change_percentage: 276000.0,
          atl_date: '2019-09-20T00:00:00.000Z',
          last_updated: new Date().toISOString(),
        },
        {
          id: 'cardano',
          symbol: 'ada',
          name: 'Cardano',
          image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
          current_price: 105.06,
          market_cap: 40000000000,
          market_cap_rank: 8,
          total_volume: 2000000000,
          high_24h: 110,
          low_24h: 90,
          price_change_24h: 14.94,
          price_change_percentage_24h: 16.31,
          market_cap_change_24h: 6000000000,
          market_cap_change_percentage_24h: 16.31,
          circulating_supply: 38000000000,
          total_supply: 45000000000,
          max_supply: 45000000000,
          ath: 3.09,
          ath_change_percentage: -96.6,
          ath_date: '2021-09-02T06:00:10.474Z',
          atl: 0.01925275,
          atl_change_percentage: 545000.0,
          atl_date: '2020-03-13T02:22:55.044Z',
          last_updated: new Date().toISOString(),
        },
        {
          id: 'tron',
          symbol: 'trx',
          name: 'TRON',
          image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
          current_price: 5.29,
          market_cap: 50000000000,
          market_cap_rank: 10,
          total_volume: 3000000000,
          high_24h: 6.5,
          low_24h: 5.0,
          price_change_24h: -1.05,
          price_change_percentage_24h: -16.58,
          market_cap_change_24h: -10000000000,
          market_cap_change_percentage_24h: -16.58,
          circulating_supply: 95000000000,
          total_supply: 100000000000,
          max_supply: 100000000000,
          ath: 0.231673,
          ath_change_percentage: -97.7,
          ath_date: '2018-01-05T00:00:00.000Z',
          atl: 0.00180434,
          atl_change_percentage: 193.0,
          atl_date: '2017-11-12T00:00:00.000Z',
          last_updated: new Date().toISOString(),
        },
        {
          id: 'tether',
          symbol: 'usdt',
          name: 'Tether',
          image: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
          current_price: 73.00,
          market_cap: 80000000000,
          market_cap_rank: 3,
          total_volume: 50000000000,
          high_24h: 73.50,
          low_24h: 72.50,
          price_change_24h: 0.05,
          price_change_percentage_24h: 0.07,
          market_cap_change_24h: 50000000,
          market_cap_change_percentage_24h: 0.07,
          circulating_supply: 11000000000,
          total_supply: 11000000000,
          max_supply: null,
          ath: 1.32,
          ath_change_percentage: -44.7,
          ath_date: '2018-07-24T00:00:00.000Z',
          atl: 0.572521,
          atl_change_percentage: 27.5,
          atl_date: '2015-03-02T00:00:00.000Z',
          last_updated: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingMarketData(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadWalletData();
    loadMarketData();
  }, []);

  // Start live price updates when wallet data is loaded
  useEffect(() => {
    if (walletData && walletData.tokens) {
      // Get addresses for live price fetching
      const tokenAddresses = walletData.tokens
        .map((token: any) => token.address)
        .filter(Boolean);
      
      if (tokenAddresses.length > 0) {
        // Fetch live prices for all tokens
        fetchPrices(tokenAddresses);
        
        // Set up interval for price updates (respecting API rate limits)
        const interval = setInterval(() => {
          fetchPrices(tokenAddresses);
        }, 60000); // Update every 60 seconds to respect API limits
        
        return () => {
          clearInterval(interval);
          stopPriceRefresh();
        };
      }
    }
  }, [walletData, fetchPrices, stopPriceRefresh]);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const portfolioAnimatedStyle = useAnimatedStyle(() => ({
    opacity: portfolioOpacity.value,
    transform: [{ scale: portfolioScale.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const assetsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: assetsOpacity.value,
    transform: [{ translateY: assetsTranslateY.value }],
  }));

  // Start animations when data loads
  useEffect(() => {
    if (!loadingData && walletData) {
      // Header animation
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

      // Portfolio animation
      setTimeout(() => {
        portfolioOpacity.value = withTiming(1, { duration: 800 });
        portfolioScale.value = withSpring(1, { damping: 12, stiffness: 120 });
      }, 200);

      // Actions animation
      setTimeout(() => {
        actionsOpacity.value = withTiming(1, { duration: 600 });
        actionsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 400);

      // Assets animation
      setTimeout(() => {
        assetsOpacity.value = withTiming(1, { duration: 600 });
        assetsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 600);
    }
  }, [loadingData, walletData]);

  // Log screen focus
  useFocusEffect(
    useCallback(() => {
      logger.logScreenFocus('HomeScreen');
    }, [])
  );

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTokenBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  const calculateTotalValue = () => {
    if (!walletData || !walletData.tokens) return 0;
    return walletData.tokens.reduce((total: number, token: any) => {
      const liveUSDValue = calculateUSDValue(token.address, token.balance);
      return total + (liveUSDValue || token.usdValue || 0);
    }, 0);
  };

  const onRefresh = async () => {
    await loadWalletData();
    await loadMarketData();
  };

  const handleFilterPress = (filter: AssetFilter) => {
    setSelectedFilter(filter);
    logger.logButtonPress('Asset Filter', `switch to ${filter}`);
  };

  const getFilteredMarketData = () => {
    switch (selectedFilter) {
      case 'gainer':
        return marketData.filter(coin => coin.price_change_percentage_24h > 0);
      case 'loser':
        return marketData.filter(coin => coin.price_change_percentage_24h < 0);
      case 'favourites':
        // For now, return top 5 by market cap as "favourites"
        return marketData.slice(0, 5);
      default:
        return marketData;
    }
  };

  const generateSparklineData = (priceChange: number) => {
    // Generate mock sparkline data based on price change
    const basePrice = 100;
    const dataPoints = 20;
    const data = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const trend = priceChange > 0 ? 1 : -1;
      const volatility = Math.random() * 0.1;
      const price = basePrice + (trend * Math.random() * Math.abs(priceChange) * 0.1) + (Math.random() - 0.5) * volatility;
      data.push(price);
    }
    
    return data;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Particle Effects */}
      <ParticleEffect 
        type="confetti" 
        active={showParticles} 
        onComplete={() => setShowParticles(false)}
      />
      
      {/* Enhanced background gradient */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
      }} />

      {/* Subtle background pattern */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
        <View style={{ position: 'absolute', top: 100, left: 40, width: 200, height: 200, backgroundColor: '#3b82f6', borderRadius: 100 }} />
        <View style={{ position: 'absolute', top: 300, right: 60, width: 150, height: 150, backgroundColor: '#10b981', borderRadius: 75 }} />
        <View style={{ position: 'absolute', bottom: 200, left: 80, width: 120, height: 120, backgroundColor: '#f59e0b', borderRadius: 60 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loadingData || loadingMarketData} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }, headerAnimatedStyle]}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5,
          }}>
            RuneKey
          </Text>
        </Animated.View>
          
        {/* Enhanced Total Portfolio Value */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, portfolioAnimatedStyle]}>
          {walletData ? (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                  fontWeight: '500',
                }}>
                  Total Portfolio Value
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedPriceChange 
                    value={40.09}
                    className="mr-2"
                  />
                </View>
              </View>
              <View style={{ marginBottom: 8 }}>
                <AnimatedNumber
                  value={calculateTotalValue()}
                  format="currency"
                  style={{
                    fontSize: 36,
                    fontWeight: 'bold',
                    color: '#1e293b',
                    letterSpacing: -1,
                  }}
                  duration={1500}
                />
              </View>
            </View>
          ) : (
            <PortfolioSkeleton />
          )}
        </Animated.View>

        {/* Enhanced Quick Actions */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 32 }, actionsAnimatedStyle]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {/* Send Button */}
            <TouchableOpacity
              style={{
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
              onPress={() => {
                logger.logButtonPress('Send', 'navigate to send screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Send' as never);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#fef2f2',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.2)',
              }}>
                <Ionicons name="arrow-up" size={28} color="#ef4444" />
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
              }}>
                Send
              </Text>
            </TouchableOpacity>

            {/* Receive Button */}
            <TouchableOpacity
              style={{
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
              onPress={() => {
                logger.logButtonPress('Receive', 'navigate to receive screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#f0fdf4',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#22c55e',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.2)',
              }}>
                <Ionicons name="arrow-down" size={28} color="#22c55e" />
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
              }}>
                Receive
              </Text>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              style={{
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
              onPress={() => {
                logger.logButtonPress('Swap', 'navigate to swap screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#eff6ff',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.2)',
              }}>
                <Ionicons name="swap-horizontal" size={28} color="#3b82f6" />
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
              }}>
                Swap
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Assets Section */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingBottom: 32 }, assetsAnimatedStyle]}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: 16,
          }}>
            Assets
          </Text>

          {/* Filter Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 12,
            padding: 2,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            {(['all', 'gainer', 'loser', 'favourites'] as AssetFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: selectedFilter === filter ? '#3b82f6' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => handleFilterPress(filter)}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedFilter === filter ? '#ffffff' : '#64748b',
                  textTransform: 'capitalize',
                }}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Loading Indicator */}
          {loadingMarketData && (
            <View style={{ marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((index) => (
                <TokenSkeleton key={index} />
              ))}
            </View>
          )}

          {/* Live Price Indicator */}
          {isLoadingPrices && !loadingMarketData && (
            <View style={{
              backgroundColor: '#f0fdf4',
              borderWidth: 1,
              borderColor: '#bbf7d0',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#22c55e',
                borderRadius: 4,
                marginRight: 8,
              }} />
              <Text style={{
                color: '#166534',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Updating live prices...
              </Text>
            </View>
          )}
          
          {/* Market Data List */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
            {getFilteredMarketData().map((coin, index) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              const sparklineData = generateSparklineData(coin.price_change_percentage_24h);
              
              return (
                <TouchableOpacity
                  key={coin.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: index < getFilteredMarketData().length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
                  }}
                  onPress={() => {
                    logger.logButtonPress(`${coin.symbol.toUpperCase()} Token`, 'view token details');
                    navigation.navigate('TokenDetails', { 
                      token: {
                        id: coin.id,
                        symbol: coin.symbol.toUpperCase(),
                        name: coin.name,
                        image: coin.image,
                        current_price: coin.current_price,
                        price_change_percentage_24h: coin.price_change_percentage_24h,
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  {/* Token Icon */}
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Image 
                      source={{ uri: coin.image }} 
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                  </View>

                  {/* Token Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: 4,
                    }}>
                      {coin.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#64748b',
                    }}>
                      {coin.symbol.toUpperCase()}
                    </Text>
                  </View>

                  {/* Sparkline Chart */}
                  <View style={{ marginHorizontal: 16 }}>
                    <SparklineChart
                      data={sparklineData}
                      width={60}
                      height={30}
                      color={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                    />
                  </View>

                  {/* Price and Change */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: 4,
                    }}>
                      ₹{coin.current_price.toFixed(2)}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isPositive ? '#22c55e' : '#ef4444',
                    }}>
                      {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Fallback for no data */}
            {getFilteredMarketData().length === 0 && !loadingMarketData && (
              <View style={{
                padding: 32,
                alignItems: 'center',
              }}>
                <Ionicons name="trending-down" size={48} color="#94a3b8" />
                <Text style={{
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 16,
                }}>
                  No assets found for this filter
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};