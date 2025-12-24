import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CustomLoadingAnimation,
} from '../components';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { priceService, CoinInfo } from '../services/api/priceService';
import { logger } from '../utils/logger';
import { formatLargeCurrency } from '../utils/formatters';
import investingData from '../mockData/api/investing.json';
import { investingService } from '../services/api/investingService';
import { Investment } from '../types';
import { useThemeColors } from '../utils/theme';

const initialInvestingHoldings: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

const { width: screenWidth } = Dimensions.get('window');

type AssetFilter = 'all' | 'gainer' | 'loser';

export const HomeScreen: React.FC = () => {
  const colors = useThemeColors();
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
  const [investmentHoldings, setInvestmentHoldings] = useState<any[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
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

  // Load investment quotes
  const loadInvestmentQuotes = useCallback(async () => {
    if (investmentHoldings.length === 0) return;
    
    setLoadingInvestments(true);
    try {
      const response = await investingService.fetchQuotes(investmentHoldings);
      const quotes = response.data || {};
      
      const holdingsWithPrices = investmentHoldings.map((investment) => {
        const symbol = investment.symbol.toUpperCase();
        const quote = quotes[symbol];
        
        const currentPrice = typeof quote?.price === 'number' && Number.isFinite(quote.price)
          ? quote.price
          : investment.averagePrice || 0;
        
        const changePercent = typeof quote?.changePercent === 'number' && Number.isFinite(quote.changePercent)
          ? quote.changePercent
          : 0;
        
        const marketValue = investment.quantity * currentPrice;
        
        return {
          ...investment,
          currentPrice,
          changePercent,
          marketValue,
          assetType: 'investment' as const,
        };
      });
      
      setInvestmentHoldings(holdingsWithPrices);
    } catch (error) {
      console.error('Error loading investment quotes:', error);
    } finally {
      setLoadingInvestments(false);
    }
  }, [investmentHoldings]);

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

  // Initialize investment holdings from imported data
  useEffect(() => {
    if (initialInvestingHoldings.length > 0 && investmentHoldings.length === 0) {
      setInvestmentHoldings(initialInvestingHoldings);
    }
  }, []);

  // Load investment quotes when holdings are available
  useEffect(() => {
    if (investmentHoldings.length > 0) {
      loadInvestmentQuotes();
    }
  }, [investmentHoldings.length, loadInvestmentQuotes]);

  // Load data on mount
  useEffect(() => {
    loadMarketData();
  }, []);

  // Auto-connect dev wallet if not connected
  useEffect(() => {
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

  // Memoized utility functions to prevent recreation on every render
  const truncateAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const formatUSD = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatTokenBalance = useCallback((balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  }, []);

  // Memoized total value calculation - only recalculates when dependencies change
  const totalValue = useMemo(() => {
    if (!currentWallet || !currentWallet.tokens) return 0;
    
    return currentWallet.tokens.reduce((total: number, token: any) => {
      // Use live price from dev wallet if available, otherwise fallback to mock prices
      const livePrice = token.currentPrice || getTokenPrice(token.address) || 0;
      const tokenBalance = typeof token.balance === 'string' ? parseFloat(token.balance) : token.balance || 0;
      const tokenValue = tokenBalance * livePrice;
      
      return total + tokenValue;
    }, 0);
  }, [currentWallet?.tokens, getTokenPrice]);

  const calculateTotalValue = useCallback(() => totalValue, [totalValue]);

  // Memoized portfolio change calculation - only recalculates when total value or timeframe changes
  const portfolioChange = useMemo(() => {
    if (!currentWallet || !currentWallet.tokens) return { percentage: 0, absolute: 0 };
    
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
    
    const historicalValue = totalValue * historicalMultiplier;
    const absoluteChange = totalValue - historicalValue;
    const percentageChange = historicalValue > 0 ? (absoluteChange / historicalValue) * 100 : 0;
    
    return {
      percentage: percentageChange,
      absolute: absoluteChange
    };
  }, [totalValue, selectedTimeframe, currentWallet?.tokens]);

  const calculatePortfolioChange = useCallback(() => portfolioChange, [portfolioChange]);

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
    
    // Refresh both market data, dev wallet data, and investment quotes for consistency
    await Promise.all([
      loadMarketData(),
      currentWallet?.id === 'developer-wallet' ? refreshDevWallet() : Promise.resolve(),
      investmentHoldings.length > 0 ? loadInvestmentQuotes() : Promise.resolve()
    ]);
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter as AssetFilter);
    logger.logButtonPress('Asset Filter', `switch to ${filter}`);
  };

  // Memoized filtered market data - only recalculates when dependencies change
  const filteredMarketData = useMemo(() => {
    // Combine crypto tokens and investments
    const cryptoAssets = currentWallet?.tokens || [];
    const investmentAssets = investmentHoldings || [];
    
    // Format crypto assets
    const formattedCrypto = cryptoAssets.map((token: any) => {
      const priceChange = token.priceChange24h || getTokenPriceChange(token.address) || 0;
      const currentPrice = token.currentPrice || getTokenPrice(token.address) || 0;
      const balance = typeof token.balance === 'string' ? parseFloat(token.balance) : token.balance || 0;
      const marketValue = balance * currentPrice;
      
      return {
        ...token,
        assetType: 'crypto' as const,
        marketValue,
        priceChange,
        currentPrice,
        balance,
        decimals: token.decimals || 18,
      };
    });
    
    // Format investment assets
    const formattedInvestments = investmentAssets.map((investment: any) => {
      const currentPrice = investment.currentPrice || investment.averagePrice || 0;
      const marketValue = investment.marketValue || (investment.quantity * currentPrice);
      const priceChange = investment.changePercent || 0;
      
      return {
        ...investment,
        assetType: 'investment' as const,
        marketValue,
        priceChange,
        currentPrice,
        balance: investment.quantity,
        symbol: investment.symbol,
        name: investment.name,
        logoURI: investment.icon,
        decimals: 0, // Stocks don't use decimals
      };
    });
    
    // Combine both asset types
    const allAssets = [...formattedCrypto, ...formattedInvestments];
    
    // Apply filter
    const filtered = (() => {
      switch (selectedFilter) {
        case 'gainer':
          return allAssets.filter((asset: any) => asset.priceChange > 0);
        case 'loser':
          return allAssets.filter((asset: any) => asset.priceChange < 0);
        default:
          return allAssets;
      }
    })();
    
    // Remove duplicates by symbol (keep first occurrence)
    const uniqueAssets = filtered.filter((asset: any, index: number, self: any[]) => 
      index === self.findIndex((a: any) => 
        a.symbol?.toUpperCase() === asset.symbol?.toUpperCase() &&
        a.assetType === asset.assetType
      )
    );
    
    // Sort by market value from largest to smallest
    const sortedAssets = uniqueAssets.sort((a: any, b: any) => {
      return (b.marketValue || 0) - (a.marketValue || 0);
    });
    
    return sortedAssets;
  }, [currentWallet?.tokens, investmentHoldings, selectedFilter, getTokenPrice, getTokenPriceChange]);

  const getFilteredMarketData = useCallback(() => filteredMarketData, [filteredMarketData]);

  const activeCapitalValue = useMemo(() => {
    if (!currentWallet?.tokens) {
      return 0;
    }

    const stableToken = currentWallet.tokens.find(
      (token: any) => token.symbol?.toUpperCase() === 'USDT'
    );

    if (!stableToken) {
      return 0;
    }

    const balance = parseFloat(stableToken.balance || '0') || 0;
    const price =
      stableToken.currentPrice ||
      getTokenPrice(stableToken.address) ||
      1;

    const usdValue = balance * price;

    return Number.isFinite(usdValue) ? usdValue : 0;
  }, [currentWallet?.tokens, getTokenPrice]);

  // Memoized sparkline data generator - use useCallback to prevent recreation
  const generateSparklineData = useCallback((priceChange: number) => {
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
  }, []);

  const initialInvestingCost = useMemo(() => {
    return initialInvestingHoldings.reduce((total, holding) => {
      return total + holding.quantity * holding.averagePrice;
    }, 0);
  }, []);

  const [investingTotals, setInvestingTotals] = useState({
    cost: initialInvestingCost,
    market: 0,
  });

  const refreshInvestingTotals = useCallback(async () => {
    if (investmentHoldings.length === 0) {
      setInvestingTotals({ cost: 0, market: 0 });
      return;
    }

    const response = await investingService.fetchQuotes(investmentHoldings);
    const quotes = response.data || {};

    const { totalMarket, missingSymbols } = investmentHoldings.reduce(
      (acc, holding) => {
        const symbol = holding.symbol.toUpperCase();
        const quote = quotes[symbol];
        if (typeof quote?.price === 'number' && Number.isFinite(quote.price)) {
          acc.totalMarket += holding.quantity * quote.price;
        } else {
          acc.missingSymbols.push(symbol);
        }
        return acc;
      },
      { totalMarket: 0, missingSymbols: [] as string[] }
    );

    if (missingSymbols.length > 0) {
      console.warn(
        '⚠️ Missing live investing quotes for symbols:',
        missingSymbols.join(', ')
      );
    }

    setInvestingTotals((prev) => {
      if (!response.success) {
        return {
          cost: initialInvestingCost,
          market: prev.market,
        };
      }

      return {
        cost: initialInvestingCost,
        market: totalMarket,
      };
    });
  }, [initialInvestingCost]);

  useEffect(() => {
    refreshInvestingTotals();
  }, [refreshInvestingTotals]);

  useFocusEffect(
    useCallback(() => {
      refreshInvestingTotals();
    }, [refreshInvestingTotals])
  );

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
          spinnerSize="large"
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
        <Animated.View style={[{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.textPrimary,
                letterSpacing: -0.3,
                marginRight: 8,
              }}>
                Wallet
              </Text>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Balance Visibility', 'toggle visibility');
                }}
              >
                <Ionicons name="eye" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Chart', 'open chart');
                }}
              >
                <Ionicons name="trending-up-outline" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Notifications', 'open notifications');
                }}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 6,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Settings', 'open settings');
                  navigation.navigate('Settings' as never);
                }}
              >
                <Ionicons name="settings-outline" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
          
        {/* Main Balance Display - Enhanced */}
        <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, portfolioAnimatedStyle]}>
          {currentWallet ? (
            <View style={{
              backgroundColor: colors.backgroundCard,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.primary + '33',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <View style={{ alignItems: 'center' }}>
                {/* Main Balance - Scaled Down */}
                <View style={{ marginBottom: 8 }}>
                  <AnimatedNumber
                    value={totalValue}
                    format="currency"
                    style={{
                      fontSize: 42,
                      fontWeight: '800',
                      color: colors.textPrimary,
                      letterSpacing: -1.5,
                      textAlign: 'center',
                      textShadowColor: colors.primary + '4D',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                    duration={1500}
                  />
                </View>
                
                {/* Percentage Change - Scaled Down */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 12,
                  backgroundColor: colors.backgroundTertiary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}>
                  {(() => {
                    const change = portfolioChange;
                    const isPositive = change.percentage >= 0;
                    return (
                      <>
                        <Ionicons 
                          name={isPositive ? "trending-up" : "trending-down"} 
                          size={16} 
                          color={isPositive ? colors.success : colors.error} 
                        />
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: isPositive ? colors.success : colors.error,
                          marginLeft: 4,
                        }}>
                          {change.percentage.toFixed(2)}%
                        </Text>
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: colors.textTertiary,
                          marginLeft: 6,
                        }}>
                          ({isPositive ? '+' : ''}{formatLargeCurrency(change.absolute)})
                        </Text>
                      </>
                    );
                  })()}
                </View>
                
                {/* Sparkline Chart - Scaled Down */}
                <View style={{ 
                  width: '100%', 
                  height: 50, 
                  marginBottom: 4,
                  backgroundColor: colors.backgroundTertiary,
                  borderRadius: 10,
                  padding: 6,
                }}>
                  {(() => {
                    const change = portfolioChange;
                    const isPositive = change.percentage >= 0;
                    return (
                      <SparklineChart
                        data={generateSparklineData(change.percentage)}
                        width={screenWidth - 72}
                        height={38}
                        color={isPositive ? colors.success : colors.error}
                        strokeWidth={2.5}
                      />
                    );
                  })()}
                </View>
              </View>
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              backgroundColor: colors.backgroundCard,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 42,
                fontWeight: '800',
                color: colors.textPrimary,
                letterSpacing: -1.5,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                $0.00
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textTertiary,
                fontWeight: '600',
                marginBottom: 4,
              }}>
                {isConnectingWallet ? "Connecting Wallet..." : "Loading Portfolio..."}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Timeframe Selectors - Enhanced */}
        <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, portfolioAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            {['1D', '1W', '1M', '1Y', 'ALL'].map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderRadius: 10,
                  backgroundColor: selectedTimeframe === timeframe ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => {
                  logger.logButtonPress('Timeframe', `select ${timeframe}`);
                  setSelectedTimeframe(timeframe);
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: selectedTimeframe === timeframe ? colors.textInverse : colors.textTertiary,
                }}>
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons - Enhanced */}
        <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, actionsAnimatedStyle]}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            gap: 8,
          }}>
            {/* Buy Button */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: colors.primary + '26',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.primary + '66',
              }}
              onPress={() => {
                logger.logButtonPress('Buy', 'navigate to buy screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Buy' as never);
              }}
              activeOpacity={0.8}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: colors.primary,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Ionicons name="add" size={22} color={colors.textInverse} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                Buy
              </Text>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: colors.success + '26',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.success + '66',
              }}
              onPress={() => {
                logger.logButtonPress('Swap Shortcut', 'navigate to swap screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Swap' as never);
              }}
              activeOpacity={0.8}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: colors.success,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Ionicons name="swap-horizontal" size={22} color={colors.textInverse} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                Swap
              </Text>
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: colors.error + '26',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.error + '66',
              }}
              onPress={() => {
                logger.logButtonPress('Send', 'navigate to send screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Send' as never);
              }}
              activeOpacity={0.8}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: colors.error,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                shadowColor: colors.error,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Ionicons name="arrow-up" size={22} color={colors.textInverse} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                Send
              </Text>
            </TouchableOpacity>

            {/* Receive Button */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: 'rgba(245, 158, 11, 0.4)',
              }}
              onPress={() => {
                logger.logButtonPress('Receive', 'navigate to receive screen');
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
                navigation.navigate('Receive' as never);
              }}
              activeOpacity={0.8}
            >
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: '#f59e0b',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Ionicons name="arrow-down" size={22} color={colors.textInverse} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                Receive
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Allocation Section - Enhanced */}
        <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, assetsAnimatedStyle]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                logger.logButtonPress('Allocation', 'view detailed allocation');
                navigation.navigate('Allocation' as never);
              }}
              style={{
              flex: 1,
              backgroundColor: colors.backgroundCard,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.primary + '4D',
              padding: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.textPrimary,
                marginBottom: 12,
                letterSpacing: 0.5,
              }}>
                ALLOCATION
              </Text>

              <View style={{
                alignItems: 'center',
              }}>
                <View style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: colors.backgroundTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: colors.primary,
                }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: colors.backgroundTertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '600',
                      color: colors.textTertiary,
                    }}>
                      Portfolio
                    </Text>
                  </View>
                </View>

                <View style={{
                  width: '100%',
                  marginTop: 12,
                  alignItems: 'center',
                }}>
                  {[
                    filteredMarketData.slice(0, 3),
                    filteredMarketData.slice(3, 6),
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
                            marginBottom: columnIndex === 0 ? 6 : 0,
                        }}
                      >
                        {group.map((token: any, index: number) => {
                          const color = colorPalette[index] || '#64748b';

                          return (
                            <View key={`${token.address || token.symbol}-${columnIndex}-${index}`} style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                                marginRight: index < group.length - 1 ? 10 : 0,
                            }}>
                              <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: color,
                                marginRight: 4,
                              }} />
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: '500',
                                  color: colors.textPrimary,
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

                <View style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Investing')}
              style={{
                flex: 1,
                backgroundColor: colors.backgroundCard,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.success + '4D',
                padding: 16,
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: colors.textPrimary,
                  letterSpacing: 0.5,
                }}>
                  INVESTING
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>

              <View style={{
                flex: 1,
                justifyContent: 'space-between',
              }}>
                <View>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: colors.textPrimary,
                    letterSpacing: -0.8,
                    marginBottom: 4,
                  }}>
                    {formatLargeCurrency(activeCapitalValue)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textTertiary,
                    fontWeight: '600',
                  }}>
                    Active capital
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 12,
                  backgroundColor: colors.success + '26',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.success + '4D',
                  alignSelf: 'flex-start',
                }}>
                  <Ionicons name="trending-up" size={14} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.success,
                  }}>
                    +4.2% today
                  </Text>
                </View>

                <View style={{
                  marginTop: 20,
                }}>
                {[
                  {
                    label: 'Total Investment',
                    value: formatLargeCurrency(investingTotals.cost),
                  },
                  {
                    label: 'Current Market Value',
                    value: formatLargeCurrency(investingTotals.market),
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      paddingVertical: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      color: colors.textTertiary,
                      fontWeight: '600',
                      marginBottom: 2,
                    }}>
                      {item.label}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.textPrimary,
                      fontWeight: '700',
                    }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Assets Title - Enhanced */}
        <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, actionsAnimatedStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: colors.textPrimary,
                letterSpacing: -0.4,
                marginBottom: 4,
              }}>
                Assets
              </Text>
              <Text style={{
                fontSize: 13,
                color: colors.textTertiary,
                fontWeight: '500',
              }}>
                Crypto & Traditional Investments
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Assets Section */}
        <Animated.View style={[{ paddingHorizontal: 16, paddingBottom: 32 }, assetsAnimatedStyle]}>
          
          {/* Loading Indicator - Enhanced */}
          {loadingMarketData && (
            <View style={{ 
              marginBottom: 16, 
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <CustomLoadingAnimation
                message="Loading market data..."
                size="medium"
                variant="inline"
                backgroundColor={colors.backgroundSecondary}
              />
            </View>
          )}

          {/* Live Price Indicator - Enhanced */}
          {isLoadingPrices && !loadingMarketData && (
            <View style={{
              backgroundColor: colors.success + '33',
              borderWidth: 1.5,
              borderColor: colors.success + '80',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: colors.success,
                borderRadius: 4,
                marginRight: 8,
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
              }} />
              <Text style={{
                color: colors.success,
                fontWeight: '700',
                fontSize: 13,
              }}>
                Updating live prices...
              </Text>
            </View>
          )}

          {/* Fallback Data Indicator - Enhanced */}
          {!isLoadingPrices && !loadingMarketData && marketData.length === 0 && (
            <View style={{
              backgroundColor: colors.warning + '33',
              borderWidth: 1.5,
              borderColor: colors.warning + '80',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="warning" size={16} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: 13,
                color: colors.warning,
                fontWeight: '600',
              }}>
                Using fallback data - API rate limited
              </Text>
            </View>
          )}
          
          {/* Asset List - Enhanced (Combined Crypto + Stocks) */}
          {filteredMarketData.map((asset: any, index: number) => {
            const isCrypto = asset.assetType === 'crypto';
            const priceChange = asset.priceChange || 0;
            const isPositive = priceChange >= 0;
            const marketValue = asset.marketValue || 0;
            
            // Format balance/quantity display
            const balanceDisplay = isCrypto
              ? formatTokenBalance(asset.balance?.toString() || '0', asset.decimals || 18)
              : asset.balance?.toLocaleString() || '0';
            
            // Create unique key
            const uniqueKey = isCrypto && asset.address
              ? `${asset.address}-${index}`
              : `${asset.symbol}-${asset.assetType}-${index}`;
            
            // Determine icon border color based on asset type
            const iconBorderColor = isCrypto 
              ? '#3B82F6' 
              : '#22c55e';
            
            return (
              <TouchableOpacity
                key={uniqueKey}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.1)',
                  shadowColor: iconBorderColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() => {
                  if (isCrypto) {
                    logger.logButtonPress(`${asset.symbol} Token`, 'view token details');
                    navigation.navigate('TokenDetails', { 
                      token: {
                        id: asset.coinId,
                        symbol: asset.symbol,
                        name: asset.name,
                        image: asset.logoURI,
                        current_price: asset.currentPrice,
                        price_change_percentage_24h: priceChange,
                      }
                    });
                  } else {
                    logger.logButtonPress(`${asset.symbol} Investment`, 'view investment details');
                    navigation.navigate('InvestmentDetails', { 
                      holding: {
                        ...asset,
                        currentPrice: asset.currentPrice,
                        changePercent: priceChange,
                        marketValue: marketValue,
                      }
                    });
                  }
                }}
                activeOpacity={0.85}
              >
                {/* Asset Icon - Enhanced */}
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: colors.backgroundTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  borderWidth: 2,
                  borderColor: iconBorderColor,
                  shadowColor: iconBorderColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  {asset.logoURI || asset.icon ? (
                    <Image 
                      source={{ uri: asset.logoURI || asset.icon }} 
                      style={{ width: 32, height: 32, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{
                      color: colors.textPrimary,
                      fontWeight: '800',
                      fontSize: 14,
                    }}>
                      {asset.symbol?.slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Asset Info - Enhanced */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{
                      fontSize: 17,
                      fontWeight: '800',
                      color: colors.textPrimary,
                      letterSpacing: -0.3,
                      marginRight: 6,
                    }}>
                      {asset.symbol}
                    </Text>
                    {isCrypto ? (
                      <View style={{
                        backgroundColor: colors.primary + '33',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: colors.primary + '66',
                      }}>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '800',
                          color: colors.primary,
                          letterSpacing: 0.5,
                        }}>
                          CRYPTO
                        </Text>
                      </View>
                    ) : (
                      <View style={{
                        backgroundColor: colors.success + '33',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: colors.success + '66',
                      }}>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '800',
                          color: colors.success,
                          letterSpacing: 0.5,
                        }}>
                          {asset.type?.toUpperCase() || 'STOCK'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textTertiary,
                    fontWeight: '600',
                  }}>
                    {balanceDisplay} {isCrypto ? asset.symbol : 'shares'}
                  </Text>
                </View>

                {/* Price and Change - Enhanced */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: colors.textPrimary,
                    marginBottom: 6,
                    letterSpacing: -0.4,
                  }}>
                    {formatLargeCurrency(marketValue)}
                  </Text>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: isPositive ? colors.success + '26' : colors.error + '26',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isPositive ? colors.success + '66' : colors.error + '66',
                  }}>
                    <Ionicons 
                      name={isPositive ? "trending-up" : "trending-down"} 
                      size={13} 
                      color={isPositive ? colors.success : colors.error} 
                    />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: isPositive ? colors.success : colors.error,
                      marginLeft: 4,
                      letterSpacing: 0.2,
                    }}>
                      {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Fallback for no data - Enhanced */}
          {filteredMarketData.length === 0 && !loadingMarketData && (
            <View style={{
              padding: 40,
              alignItems: 'center',
              backgroundColor: colors.backgroundCard,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.backgroundSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: 'rgba(148, 163, 184, 0.3)',
              }}>
                <Ionicons name="wallet-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={{
                color: colors.textPrimary,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '800',
                marginBottom: 8,
                letterSpacing: -0.3,
              }}>
                No Assets Found
              </Text>
              <Text style={{
                color: '#94A3B8',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '500',
                lineHeight: 20,
              }}>
                Connect a wallet or add investments to see your portfolio
              </Text>
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};