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
  LoadingOverlay,
  TabSelector,
  UniversalBackground,
} from '../components';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { priceService, CoinInfo } from '../services/api/priceService';
import { logger } from '../utils/logger';
import { formatLargeCurrency } from '../utils/formatters';

const { width: screenWidth } = Dimensions.get('window');

type AssetFilter = 'all' | 'gainer' | 'loser';

export const HomeScreen: React.FC = () => {
  const { isConnected, currentWallet, activeNetwork } = useWalletStore();
  const { connectDevWallet, refreshDevWallet } = useDevWallet();
  const { 
    fetchPrices, 
    startPriceRefresh, 
    stopPriceRefresh, 
    isLoading: isLoadingPrices,
    getTokenPrice,
    getTokenPriceChange,
    calculateUSDValue
  } = usePrices();
  const [loadingData, setLoadingData] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [marketData, setMarketData] = useState<CoinInfo[]>([]);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<AssetFilter>('all');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [animationsTriggered, setAnimationsTriggered] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
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

  // Load market data from CoinGecko
  const loadMarketData = async () => {
    setLoadingMarketData(true);
    try {
      const result = await priceService.fetchMarketData(20);
      if (result.success && result.data) {
        setMarketData(result.data);
        logger.logButtonPress('HomeScreen', 'load market data');
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
          }
        ]);
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
          max_supply: 0,
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
          max_supply: 0,
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
    loadMarketData();
  }, []);

  // Auto-connect dev wallet if not connected
  useEffect(() => {
    console.log('🔍 HomeScreen: isConnected =', isConnected, 'currentWallet =', currentWallet ? 'exists' : 'null');
    
    // Only connect if we don't have a wallet and we're not already connecting
    if (!currentWallet && !isConnectingWallet) {
      console.log('🔄 Connecting Dev Wallet for fresh data...');
      setIsConnectingWallet(true);
      setLoadingData(true);
      connectDevWallet().finally(() => {
        setIsConnectingWallet(false);
        setLoadingData(false);
      });
    } else if (currentWallet && loadingData) {
      // If wallet is already connected but we're still loading, stop loading
      setLoadingData(false);
    }
  }, [currentWallet, connectDevWallet, isConnectingWallet, loadingData]);

  // Refresh dev wallet data when screen focuses to get latest live prices
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('👁️ SCREEN: HomeScreen screen focused');
      if (currentWallet?.id === 'developer-wallet') {
        console.log('🔄 Refreshing dev wallet data for latest live prices...');
        refreshDevWallet();
      }
    });

    return unsubscribe;
  }, [navigation, currentWallet, refreshDevWallet]);

  // Start live price updates when wallet data is loaded
  useEffect(() => {
    if (currentWallet && currentWallet.tokens) {
      // Get addresses for live price fetching
      const tokenAddresses = currentWallet.tokens
        .map((token: any) => token.address)
        .filter(Boolean);
      
      if (tokenAddresses.length > 0) {
        // Fetch live prices for all tokens
        fetchPrices(tokenAddresses);
        
        // Set up interval for price updates (respecting API rate limits)
        const interval = setInterval(() => {
          fetchPrices(tokenAddresses);
        }, 120000); // Update every 2 minutes to respect API limits
        
        // Also refresh dev wallet data periodically for consistency
        const devWalletInterval = setInterval(() => {
          if (currentWallet?.id === 'developer-wallet') {
            console.log('🔄 Periodic dev wallet refresh for consistency...');
            refreshDevWallet();
          }
        }, 180000); // Update every 3 minutes
        
        return () => {
          clearInterval(interval);
          clearInterval(devWalletInterval);
          stopPriceRefresh();
        };
      }
    }
  }, [currentWallet, fetchPrices, stopPriceRefresh, refreshDevWallet]);

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
    if (!loadingData && currentWallet && !animationsTriggered) {
      console.log('🎬 Starting HomeScreen animations...');
      setAnimationsTriggered(true);
      
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
  }, [loadingData, currentWallet, animationsTriggered]);

  // Reset animations when wallet changes
  useEffect(() => {
    if (currentWallet) {
      setAnimationsTriggered(false);
    }
  }, [currentWallet?.id]); // Only reset when wallet ID changes

  // Log screen focus
  useFocusEffect(
    useCallback(() => {
      logger.logScreenFocus('HomeScreen');
      
      // Only trigger animations on focus if wallet exists and animations haven't been triggered
      if (currentWallet && !animationsTriggered && !loadingData) {
        console.log('🎬 Triggering animations on screen focus...');
        setAnimationsTriggered(true);
        
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
    }, [currentWallet, animationsTriggered, loadingData])
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
    if (!currentWallet || !currentWallet.tokens) return 0;
    
    return currentWallet.tokens.reduce((total: number, token: any) => {
      // Use live price from dev wallet if available, otherwise fallback to mock prices
      const livePrice = token.currentPrice || getTokenPrice(token.address) || 0;
      const tokenBalance = typeof token.balance === 'string' ? parseFloat(token.balance) : token.balance || 0;
      const tokenValue = tokenBalance * livePrice;
      
      console.log(`💰 ${token.symbol}: ${tokenBalance} × $${livePrice} = $${tokenValue.toLocaleString()}`);
      
      return total + tokenValue;
    }, 0);
  };

  const calculatePortfolioChange = () => {
    if (!currentWallet || !currentWallet.tokens) return { percentage: 0, absolute: 0 };
    
    const currentValue = calculateTotalValue();
    
    // Generate mock historical data based on timeframe
    let historicalMultiplier = 1;
    switch (selectedTimeframe) {
      case '1D':
        historicalMultiplier = 0.99; // -1% for 1 day
        break;
      case '1W':
        historicalMultiplier = 0.95; // -5% for 1 week
        break;
      case '1M':
        historicalMultiplier = 0.90; // -10% for 1 month
        break;
      case '1Y':
        historicalMultiplier = 0.80; // -20% for 1 year
        break;
      case 'ALL':
        historicalMultiplier = 0.70; // -30% for all time
        break;
      default:
        historicalMultiplier = 0.99;
    }
    
    const historicalValue = currentValue * historicalMultiplier;
    const absoluteChange = currentValue - historicalValue;
    const percentageChange = historicalValue > 0 ? (absoluteChange / historicalValue) * 100 : 0;
    
    return {
      percentage: percentageChange,
      absolute: absoluteChange
    };
  };

  const onRefresh = async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Prevent refreshing more than once every 60 seconds
    if (timeSinceLastRefresh < 60000) {
      console.log('⚠️ Refresh blocked - too soon since last refresh');
      Alert.alert(
        'Refresh Rate Limited',
        'Please wait 60 seconds between refreshes to avoid API rate limits.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLastRefreshTime(now);
    
    // Refresh both market data and dev wallet data for consistency
    await Promise.all([
      loadMarketData(),
      currentWallet?.id === 'developer-wallet' ? refreshDevWallet() : Promise.resolve()
    ]);
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter as AssetFilter);
    logger.logButtonPress('Asset Filter', `switch to ${filter}`);
  };

  const getFilteredMarketData = () => {
    // Use current wallet tokens with live API data
    if (!currentWallet || !currentWallet.tokens) return [];
    
    const filtered = (() => {
      switch (selectedFilter) {
        case 'gainer':
          return currentWallet.tokens.filter((token: any) => {
            const priceChange = token.priceChange24h || getTokenPriceChange(token.address) || 0;
            return priceChange > 0;
          });
        case 'loser':
          return currentWallet.tokens.filter((token: any) => {
            const priceChange = token.priceChange24h || getTokenPriceChange(token.address) || 0;
            return priceChange < 0;
          });
        default:
          return currentWallet.tokens;
      }
    })();
    
    // Sort tokens by USD value from largest to smallest
    const sortedTokens = filtered.sort((a: any, b: any) => {
      const aPrice = a.currentPrice || getTokenPrice(a.address) || 0;
      const bPrice = b.currentPrice || getTokenPrice(b.address) || 0;
      const aBalance = typeof a.balance === 'string' ? parseFloat(a.balance) : a.balance || 0;
      const bBalance = typeof b.balance === 'string' ? parseFloat(b.balance) : b.balance || 0;
      const aValue = aBalance * aPrice;
      const bValue = bBalance * bPrice;
      
      return bValue - aValue; // Sort descending (largest first)
    });
    
    // Log sorted order for debugging
    console.log('📊 Assets sorted by value:', sortedTokens.map((token: any) => {
      const price = token.currentPrice || getTokenPrice(token.address) || 0;
      const balance = typeof token.balance === 'string' ? parseFloat(token.balance) : token.balance || 0;
      const value = balance * price;
      return `${token.symbol}: ${formatLargeCurrency(value)}`;
    }));
    
    // Debug logging for gainer filter
    if (selectedFilter === 'gainer') {
      console.log('🔍 Gainer filter - Total tokens:', currentWallet.tokens.length);
      console.log('🔍 Gainer filter - Positive changes:', currentWallet.tokens.filter((token: any) => {
        const priceChange = token.priceChange24h || getTokenPriceChange(token.address) || 0;
        return priceChange > 0;
      }).length);
      console.log('🔍 Gainer filter - Filtered result:', filtered.length);
    }
    
    return sortedTokens;
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
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={loadingData || isConnectingWallet || loadingMarketData}
          message={
            isConnectingWallet ? "Connecting Wallet..." : 
            loadingMarketData ? "Loading Market Data..." : 
            "Loading Data..."
          }
          spinnerSize={80}
          spinnerColor="#3B82F6"
        />
        
        {/* Particle Effects */}
        <ParticleEffect 
          type="confetti" 
          active={showParticles} 
          onComplete={() => setShowParticles(false)}
        />

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loadingMarketData} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginRight: 12,
              }}>
                Wallet
              </Text>
              <TouchableOpacity
                style={{
                  padding: 8,
                }}
                onPress={() => {
                  // Toggle balance visibility
                  logger.logButtonPress('Balance Visibility', 'toggle visibility');
                }}
              >
                <Ionicons name="eye" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  padding: 8,
                  marginRight: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Calendar', 'open calendar');
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                  marginRight: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Chart', 'open chart');
                }}
              >
                <Ionicons name="trending-up-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                  marginRight: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Notifications', 'open notifications');
                }}
              >
                <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Settings', 'open settings');
                  navigation.navigate('Settings' as never);
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Crypto/Market Tabs */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#111827',
            borderRadius: 8,
            padding: 2,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#1e293b',
                borderRadius: 6,
                paddingVertical: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                logger.logButtonPress('Crypto Tab', 'switch to crypto view');
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Crypto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#111827',
                borderRadius: 6,
                paddingVertical: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                logger.logButtonPress('Market Tab', 'switch to market view');
                navigation.navigate('Market' as never);
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#94A3B8',
              }}>
                Market
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
          
        {/* Main Balance Display */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, portfolioAnimatedStyle]}>
          {currentWallet ? (
            <View style={{
              alignItems: 'center',
            }}>
              {/* Main Balance */}
              <View style={{ marginBottom: 8 }}>
                <AnimatedNumber
                  value={calculateTotalValue()}
                  format="currency"
                  style={{
                    fontSize: 44,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    letterSpacing: -1,
                    textAlign: 'center',
                  }}
                  duration={1500}
                />
              </View>
              
              {/* Percentage Change */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                {(() => {
                  const change = calculatePortfolioChange();
                  const isPositive = change.percentage >= 0;
                  return (
                    <>
                      <Ionicons 
                        name={isPositive ? "trending-up" : "trending-down"} 
                        size={16} 
                        color={isPositive ? "#22c55e" : "#ef4444"} 
                      />
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isPositive ? "#22c55e" : "#ef4444",
                        marginLeft: 4,
                      }}>
                        {change.percentage.toFixed(1)}% ({isPositive ? '+' : ''}{formatLargeCurrency(change.absolute)})
                      </Text>
                    </>
                  );
                })()}
              </View>
              
              {/* Sparkline Chart */}
              <View style={{ 
                width: '100%', 
                height: 60, 
                marginBottom: 16 
              }}>
                {(() => {
                  const change = calculatePortfolioChange();
                  const isPositive = change.percentage >= 0;
                  return (
                    <SparklineChart
                      data={generateSparklineData(change.percentage)}
                      width={screenWidth - 48}
                      height={60}
                      color={isPositive ? "#22c55e" : "#ef4444"}
                      strokeWidth={3}
                    />
                  );
                })()}
              </View>
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#FFFFFF',
                letterSpacing: -1,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                $0.00
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
                fontWeight: '500',
                marginBottom: 16,
              }}>
                {isConnectingWallet ? "Connecting Wallet..." : "Loading Portfolio..."}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Timeframe Selectors */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, portfolioAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
            {['1D', '1W', '1M', '1Y', 'ALL'].map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: selectedTimeframe === timeframe ? '#f1f5f9' : 'transparent',
                }}
                onPress={() => {
                  logger.logButtonPress('Timeframe', `select ${timeframe}`);
                  setSelectedTimeframe(timeframe);
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedTimeframe === timeframe ? '#1e293b' : '#64748b',
                }}>
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, actionsAnimatedStyle]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {/* Buy Button */}
            <TouchableOpacity
              style={{
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
              onPress={() => {
                logger.logButtonPress('Buy', 'navigate to buy screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Buy' as never);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 56,
                height: 56,
                backgroundColor: '#000000',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#1f2937',
              }}>
                <Ionicons name="add" size={24} color="#94A3B8" />
              </View>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#FFFFFF',
              }}>
                Buy
              </Text>
            </TouchableOpacity>

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
                width: 56,
                height: 56,
                backgroundColor: '#000000',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#1f2937',
              }}>
                <Ionicons name="arrow-up" size={24} color="#94A3B8" />
              </View>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#FFFFFF',
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
                navigation.navigate('Receive' as never);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 56,
                height: 56,
                backgroundColor: '#000000',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#1f2937',
              }}>
                <Ionicons name="arrow-down" size={24} color="#94A3B8" />
              </View>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#FFFFFF',
              }}>
                Receive
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Allocation Section */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, assetsAnimatedStyle]}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{
              flex: 1,
              backgroundColor: '#0b1120',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#1f2937',
              padding: 20,
              marginRight: 16,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 16,
              }}>
                ALLOCATION
              </Text>

              <View style={{
                alignItems: 'center',
              }}>
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#111827',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 6,
                  borderColor: '#3b82f6',
                }}>
                  <View style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: '#111827',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: '#94A3B8',
                    }}>
                      Portfolio
                    </Text>
                  </View>
                </View>

                <View style={{
                  width: '100%',
                  marginTop: 16,
                  alignItems: 'center',
                }}>
                  {[
                    getFilteredMarketData().slice(0, 3),
                    getFilteredMarketData().slice(3, 6),
                  ].map((group, columnIndex) => {
                    const colorPalette = columnIndex === 0
                      ? ['#3b82f6', '#22c55e', '#f59e0b']
                      : ['#6366f1', '#14b8a6', '#f97316'];

                    return (
                      <View
                        key={`allocation-column-${columnIndex}`}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: columnIndex === 0 ? 8 : 0,
                        }}
                      >
                        {group.map((token: any, index: number) => {
                          const color = colorPalette[index] || '#64748b';

                          return (
                            <View key={`${token.symbol}-${columnIndex}`} style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                                marginRight: index < group.length - 1 ? 16 : 0,
                            }}>
                              <View style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: color,
                                marginRight: 6,
                              }} />
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '500',
                                  color: '#FFFFFF',
                                }}>
                                {token.symbol}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    logger.logButtonPress('Allocation', 'view detailed allocation');
                    navigation.navigate('Allocation');
                  }}
                  style={{ alignSelf: 'flex-end', marginTop: 12 }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: '#0b1120',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#1f2937',
              padding: 20,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 16,
              }}>
                INVESTING
              </Text>

              <View style={{
                flex: 1,
                justifyContent: 'space-between',
              }}>
                <View>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}>
                    $2.6M
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                    marginTop: 4,
                  }}>
                    Active capital
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 16,
                }}>
                  <Ionicons name="trending-up" size={16} color="#22c55e" style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#22c55e',
                  }}>
                    +4.2% today
                  </Text>
                </View>

                <View style={{
                  marginTop: 20,
                }}>
                    {[
                      { label: 'Auto-Invest', status: 'Running' },
                      { label: 'Yield Vault', status: 'Compounding' },
                    ].map((item) => (
                    <View
                      key={item.label}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 6,
                      }}
                    >
                        <Text style={{
                          fontSize: 12,
                          color: '#FFFFFF',
                          fontWeight: '500',
                        }}>
                        {item.label}
                      </Text>
                      <Text style={{
                          fontSize: 10,
                        color: '#94A3B8',
                      }}>
                        {item.status}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Assets Title */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, actionsAnimatedStyle]}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}>
            Assets
          </Text>
        </Animated.View>

        {/* Enhanced Assets Section */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingBottom: 32 }, assetsAnimatedStyle]}>
          
          {/* Loading Indicator */}
          {loadingMarketData && (
            <View style={{ 
              marginBottom: 16, 
              alignItems: 'center',
              paddingVertical: 20,
            }}>
              <LoadingSpinner size={40} color="#3B82F6" />
              <Text style={{
                marginTop: 12,
                fontSize: 14,
                color: '#94A3B8',
                fontWeight: '500',
              }}>
                Loading market data...
              </Text>
            </View>
          )}

          {/* Live Price Indicator */}
          {isLoadingPrices && !loadingMarketData && (
            <View style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.35)',
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
                color: '#22c55e',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Updating live prices...
              </Text>
            </View>
          )}

          {/* Fallback Data Indicator */}
          {!isLoadingPrices && !loadingMarketData && marketData.length === 0 && (
            <View style={{
              backgroundColor: 'rgba(250, 204, 21, 0.18)',
              borderWidth: 1,
              borderColor: 'rgba(250, 204, 21, 0.5)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="warning" size={16} color="#d97706" style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: 14,
                color: '#facc15',
                fontWeight: '500',
              }}>
                Using fallback data - API rate limited
              </Text>
            </View>
          )}
          
          {/* Asset List */}
          {getFilteredMarketData().map((token: any, index: number) => {
            // Use live prices from dev wallet if available, otherwise fallback to mock prices
            const currentPrice = token.currentPrice || getTokenPrice(token.address) || 0;
            const priceChange = token.priceChange24h || getTokenPriceChange(token.address) || 0;
            const isPositive = priceChange >= 0;
            
            // Calculate USD value based on balance and live price
            const tokenBalance = typeof token.balance === 'string' ? parseFloat(token.balance) : token.balance || 0;
            const usdValue = tokenBalance * currentPrice;
            
            return (
              <TouchableOpacity
                key={token.address}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 0,
                  marginBottom: 8,
                }}
                onPress={() => {
                  logger.logButtonPress(`${token.symbol} Token`, 'view token details');
                  navigation.navigate('TokenDetails', { 
                    token: {
                      id: token.coinId,
                      symbol: token.symbol,
                      name: token.name,
                      image: token.logoURI,
                      current_price: currentPrice,
                      price_change_percentage_24h: priceChange,
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                {/* Token Icon */}
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#111827',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Image 
                    source={{ uri: token.logoURI }} 
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                  />
                </View>

                {/* Token Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: 2,
                  }}>
                    {token.symbol}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#94A3B8',
                  }}>
                    {formatTokenBalance(token.balance, token.decimals || 18)} {token.symbol}
                  </Text>
                </View>

                {/* Price and Change */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: 2,
                  }}>
                    {formatLargeCurrency(usdValue)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={isPositive ? "trending-up" : "trending-down"} 
                      size={12} 
                      color={isPositive ? '#22c55e' : '#ef4444'} 
                    />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isPositive ? '#22c55e' : '#ef4444',
                      marginLeft: 2,
                    }}>
                      {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                    </Text>
                  </View>
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
              <Ionicons name="wallet-outline" size={48} color="#94a3b8" />
              <Text style={{
                color: '#94A3B8',
                textAlign: 'center',
                marginTop: 16,
                fontSize: 16,
              }}>
                No assets found
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Allocation Section */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, assetsAnimatedStyle]}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 16,
          }}>
            ALLOCATION
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {/* Donut Chart Placeholder */}
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#111827',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
              borderWidth: 8,
              borderColor: '#3b82f6',
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#111827',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#94A3B8',
                }}>
                  Portfolio
                </Text>
              </View>
            </View>
            
            {/* Legend */}
            <View style={{ flex: 1 }}>
              {getFilteredMarketData().slice(0, 3).map((token: any, index: number) => {
                const colors = ['#3b82f6', '#22c55e', '#f59e0b'];
                const color = colors[index] || '#64748b';
                
                return (
                  <View key={token.symbol} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: color,
                      marginRight: 8,
                    }} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#FFFFFF',
                    }}>
                      {token.symbol}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            {/* Chevron */}
            <TouchableOpacity
              onPress={() => {
                logger.logButtonPress('Allocation', 'view detailed allocation');
                navigation.navigate('Allocation');
              }}
            >
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};