import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Dimensions, Linking, StyleSheet } from 'react-native';
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
import { priceService, CoinInfo } from '../services/api/priceService';
import { dappService, DApp } from '../services/api/dappService';
import { stocksService, TrendingStock } from '../services/api/stocksService';
import { investingService, InvestmentQuote } from '../services/api/investingService';
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { LiquidGlass, LoadingSpinner, UniversalBackground, CustomLoadingAnimation } from '../components';
import { Token } from '../types';
import { useThemeColors } from '../utils/theme';
import {
  NormalizedTrendingToken,
  mapTrendingResponse,
  createFallbackTrendingTokens,
  mergeCoinInfoWithTrending,
} from '../utils/trending';

const { width: screenWidth } = Dimensions.get('window');

interface SearchResult {
  id: string;
  type: 'token' | 'dapp' | 'collection';
  name: string;
  symbol?: string;
  description: string;
  icon: string;
  trending?: boolean;
}

export const SearchScreen: React.FC = () => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'defi' | 'stocks' | 'bonds' | 'etfs' | 'dapps' | 'collections'>('all');
  const [apiTrendingTokens, setApiTrendingTokens] = useState<NormalizedTrendingToken[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // New state for tokens tab pagination
  const [topTokens, setTopTokens] = useState<CoinInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const tokensPerPage = 10;
  
  // New state for DApps tab
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [isLoadingDapps, setIsLoadingDapps] = useState(false);
  const [dappCategories, setDappCategories] = useState<string[]>([]);
  const [selectedDappCategory, setSelectedDappCategory] = useState<string>('all');
  
  // New state for stocks
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  
  // New state for ETFs
  const [etfs, setEtfs] = useState<Array<{ symbol: string; name: string; quote: InvestmentQuote }>>([]);
  const [isLoadingEtfs, setIsLoadingEtfs] = useState(false);
  
  // New state for bonds
  const [bonds, setBonds] = useState<Array<{ symbol: string; name: string; quote: InvestmentQuote }>>([]);
  const [isLoadingBonds, setIsLoadingBonds] = useState(false);
  
  const navigation = useNavigation<any>();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const searchBarScale = useSharedValue(0.9);
  const searchBarOpacity = useSharedValue(0);
  const categoriesTranslateY = useSharedValue(30);
  const categoriesOpacity = useSharedValue(0);
  const trendingTranslateY = useSharedValue(30);
  const trendingOpacity = useSharedValue(0);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SearchScreen');
      // Start animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      
      setTimeout(() => {
        searchBarOpacity.value = withTiming(1, { duration: 600 });
        searchBarScale.value = withSpring(1, { damping: 12, stiffness: 120 });
      }, 200);

      setTimeout(() => {
        categoriesOpacity.value = withTiming(1, { duration: 600 });
        categoriesTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 400);

      setTimeout(() => {
        trendingOpacity.value = withTiming(1, { duration: 600 });
        trendingTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 600);
    }, [])
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [{ scale: searchBarScale.value }],
  }));

  const categoriesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: categoriesOpacity.value,
    transform: [{ translateY: categoriesTranslateY.value }],
  }));

  const trendingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: trendingOpacity.value,
    transform: [{ translateY: trendingTranslateY.value }],
  }));

  // Memoized fetch trending tokens - prevents duplicate calls
  const fetchTrendingTokens = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (isLoadingTrending) return;
    
    setIsLoadingTrending(true);
    try {
      const result = await priceService.fetchTrendingTokens();
      if (result.success && result.data.length > 0) {
        const transformedTokens = mapTrendingResponse(result.data);
        let enrichedTokens = transformedTokens;

        try {
          const marketResponse = await priceService.fetchMarketDataByIds(
            transformedTokens.map((token) => token.id).filter(Boolean)
          );
          if (marketResponse.success && marketResponse.data.length > 0) {
            enrichedTokens = mergeCoinInfoWithTrending(transformedTokens, marketResponse.data);
          }
        } catch (marketError) {
          console.warn('SearchScreen: Unable to enrich trending tokens with market data', marketError);
        }

        setApiTrendingTokens(enrichedTokens);
        setLastUpdated(new Date());
      } else {
        // Use fallback data if API returns empty
        console.log('📊 Using fallback trending tokens data');
        setApiTrendingTokens(createFallbackTrendingTokens());
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      // Use fallback data on error
      console.log('📊 Using fallback trending tokens due to error');
      setApiTrendingTokens(createFallbackTrendingTokens());
      setLastUpdated(new Date());
    } finally {
      setIsLoadingTrending(false);
    }
  }, [isLoadingTrending]);

  // Fetch data when category is selected
  useEffect(() => {
    if (selectedCategory === 'crypto' && topTokens.length === 0) {
      fetchTopTokens(1, false);
    } else if (selectedCategory === 'defi' && topTokens.length === 0) {
      fetchDeFiTokens(1, false);
    } else if (selectedCategory === 'stocks' && stocks.length === 0) {
      fetchStocks();
    } else if (selectedCategory === 'etfs' && etfs.length === 0) {
      fetchETFs();
    } else if (selectedCategory === 'bonds' && bonds.length === 0) {
      fetchBonds();
    } else if (selectedCategory === 'dapps' && dapps.length === 0) {
      fetchDApps();
    }
  }, [selectedCategory]);

  // Memoized fetch top crypto tokens - prevents duplicate calls
  const fetchTopTokens = useCallback(async (page: number = 1, append: boolean = false) => {
    // Prevent duplicate concurrent requests
    if (isLoadingTokens && !append) return;
    
    setIsLoadingTokens(true);
    try {
      const result = await priceService.fetchTopCoins(tokensPerPage, page);
      if (result.success && result.data.length > 0) {
        if (append) {
          setTopTokens(prev => [...prev, ...result.data]);
        } else {
          setTopTokens(result.data);
        }
        setCurrentPage(page);
        setHasMorePages(result.data.length === tokensPerPage);
        setTotalTokens(prev => Math.max(prev, (page - 1) * tokensPerPage + result.data.length));
      } else {
        if (!append) {
          setTopTokens([]);
        }
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Failed to fetch top tokens:', error);
      if (!append) {
        setTopTokens([]);
      }
      setHasMorePages(false);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [isLoadingTokens, tokensPerPage]);

  // Memoized fetch DeFi tokens - prevents duplicate calls and expensive filtering on every call
  const defiKeywords = useMemo(() => 
    ['uniswap', 'aave', 'compound', 'maker', 'curve', 'yearn', 'sushi', 'pancake', 'balancer', 'synthetix', 'chainlink', 'lido', 'staked', 'wrapped', 'wbtc', 'weth'],
    []
  );

  const fetchDeFiTokens = useCallback(async (page: number = 1, append: boolean = false) => {
    // Prevent duplicate concurrent requests
    if (isLoadingTokens && !append) return;
    
    setIsLoadingTokens(true);
    try {
      // Fetch more tokens to filter DeFi ones
      const result = await priceService.fetchTopCoins(250, 1);
      if (result.success && result.data.length > 0) {
        // Filter tokens that are likely DeFi (common DeFi token names/patterns)
        const defiTokens = result.data.filter(token => 
          defiKeywords.some(keyword => 
            token.name.toLowerCase().includes(keyword) || 
            token.symbol.toLowerCase().includes(keyword) ||
            token.id.toLowerCase().includes(keyword)
          )
        );
        
        // Paginate the filtered results
        const startIndex = (page - 1) * tokensPerPage;
        const endIndex = startIndex + tokensPerPage;
        const paginatedTokens = defiTokens.slice(startIndex, endIndex);
        
        if (append) {
          setTopTokens(prev => [...prev, ...paginatedTokens]);
        } else {
          setTopTokens(paginatedTokens);
        }
        setCurrentPage(page);
        setHasMorePages(endIndex < defiTokens.length);
        setTotalTokens(defiTokens.length);
      } else {
        if (!append) {
          setTopTokens([]);
        }
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Failed to fetch DeFi tokens:', error);
      if (!append) {
        setTopTokens([]);
      }
      setHasMorePages(false);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [isLoadingTokens, tokensPerPage, defiKeywords]);

  // Memoized fetch stocks - prevents duplicate calls
  const fetchStocks = useCallback(async () => {
    if (isLoadingStocks) return;
    
    setIsLoadingStocks(true);
    try {
      const stocksData = await stocksService.fetchTrending();
      setStocks(stocksData);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
      setStocks([]);
    } finally {
      setIsLoadingStocks(false);
    }
  }, [isLoadingStocks]);

  // Memoized ETF symbols - prevent recreation on every render
  const etfSymbols = useMemo(() => [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
    { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF' },
    { symbol: 'GLD', name: 'SPDR Gold Trust' },
    { symbol: 'SLV', name: 'iShares Silver Trust' },
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  ], []);

  // Memoized fetch ETFs - prevents duplicate calls
  const fetchETFs = useCallback(async () => {
    if (isLoadingEtfs) return;
    
    setIsLoadingEtfs(true);
    try {
      const quotesResult = await investingService.fetchQuotes(
        etfSymbols.map(etf => ({
          symbol: etf.symbol,
          name: etf.name,
          type: 'etf' as const,
          market: 'NYSEARCA',
          currency: 'USD',
        }))
      );

      if (quotesResult.success) {
        const etfsWithQuotes = etfSymbols
          .map(etf => ({
            symbol: etf.symbol,
            name: etf.name,
            quote: quotesResult.data[etf.symbol],
          }))
          .filter(item => item.quote && item.quote.price > 0);
        setEtfs(etfsWithQuotes);
      } else {
        setEtfs([]);
      }
    } catch (error) {
      console.error('Failed to fetch ETFs:', error);
      setEtfs([]);
    } finally {
      setIsLoadingEtfs(false);
    }
  }, [isLoadingEtfs, etfSymbols]);

  // Memoized bond symbols - prevent recreation on every render
  const bondSymbols = useMemo(() => [
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
    { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF' },
    { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF' },
    { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
    { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF' },
    { symbol: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF' },
    { symbol: 'MUB', name: 'iShares National Muni Bond ETF' },
    { symbol: 'TIP', name: 'iShares TIPS Bond ETF' },
    { symbol: 'VCIT', name: 'Vanguard Intermediate-Term Corporate Bond ETF' },
  ], []);

  // Memoized fetch bonds - prevents duplicate calls
  const fetchBonds = useCallback(async () => {
    if (isLoadingBonds) return;
    
    setIsLoadingBonds(true);
    try {

      const quotesResult = await investingService.fetchQuotes(
        bondSymbols.map(bond => ({
          symbol: bond.symbol,
          name: bond.name,
          type: 'etf' as const,
          market: 'NYSEARCA',
          currency: 'USD',
        }))
      );

      if (quotesResult.success) {
        const bondsWithQuotes = bondSymbols
          .map(bond => ({
            symbol: bond.symbol,
            name: bond.name,
            quote: quotesResult.data[bond.symbol],
          }))
          .filter(item => item.quote && item.quote.price > 0);
        setBonds(bondsWithQuotes);
      } else {
        setBonds([]);
      }
    } catch (error) {
      console.error('Failed to fetch bonds:', error);
      setBonds([]);
    } finally {
      setIsLoadingBonds(false);
    }
  }, [isLoadingBonds, bondSymbols]);

  // Load next page of tokens
  const loadNextPage = () => {
    if (!isLoadingTokens && hasMorePages) {
      fetchTopTokens(currentPage + 1, true);
    }
  };

  // Memoized fetch DApps - prevents duplicate calls
  const fetchDApps = useCallback(async () => {
    if (isLoadingDapps) return;
    
    setIsLoadingDapps(true);
    try {
      const result = await dappService.fetchDApps();
      if (result.success && result.data.length > 0) {
        setDapps(result.data);
        
        // Get unique categories
        const categories = await dappService.getDAppCategories();
        if (categories.success) {
          setDappCategories(categories.data);
        }
      } else {
        setDapps([]);
      }
    } catch (error) {
      console.error('Failed to fetch DApps:', error);
      setDapps([]);
    } finally {
      setIsLoadingDapps(false);
    }
  }, [isLoadingDapps]);

  // Filter DApps by category
  const filterDAppsByCategory = async (category: string) => {
    setSelectedDappCategory(category);
    setIsLoadingDapps(true);
    try {
      if (category === 'all') {
        const result = await dappService.fetchDApps();
        if (result.success) {
          setDapps(result.data);
        }
      } else {
        const result = await dappService.filterDAppsByCategory(category);
        if (result.success) {
          setDapps(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to filter DApps:', error);
    } finally {
      setIsLoadingDapps(false);
    }
  };

  // Open DApp URL
  const openDApp = async (dapp: DApp) => {
    try {
      await Linking.openURL(dapp.url);
      logger.logButtonPress('DApp', `opened ${dapp.name}`);
    } catch (error) {
      console.error('Failed to open DApp:', error);
    }
  };

  const handleRefresh = () => {
    if (selectedCategory === 'crypto') {
      fetchTopTokens(1, false);
    } else if (selectedCategory === 'defi') {
      fetchDeFiTokens(1, false);
    } else if (selectedCategory === 'stocks') {
      fetchStocks();
    } else if (selectedCategory === 'etfs') {
      fetchETFs();
    } else if (selectedCategory === 'bonds') {
      fetchBonds();
    } else if (selectedCategory === 'dapps') {
      fetchDApps();
    } else {
      fetchTrendingTokens();
    }
  };

  // Start auto-refresh for trending tokens
  useEffect(() => {
    // Initial fetch
    fetchTrendingTokens();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchTrendingTokens();
    }, 30000); // Refresh every 30 seconds

    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Format time for last updated
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  // Format price change
  const formatPriceChange = (change: number) => {
    if (!Number.isFinite(change)) {
      return {
        value: '0.00',
        color: '#94A3B8',
        icon: 'remove',
      };
    }
    
    const isPositive = change >= 0;
    return {
      value: Math.abs(change).toFixed(2),
      color: isPositive ? '#22c55e' : '#ef4444',
      icon: isPositive ? 'trending-up' : 'trending-down',
    };
  };

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

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(volume);
  };

  const renderTokenItem = (token: NormalizedTrendingToken | CoinInfo, index: number) => {
    const priceChange = formatPriceChange(
      'price_change_percentage_24h' in token 
        ? token.price_change_percentage_24h 
        : (token as any).price_change_percentage_24h || 0
    );
    const currentPrice = 'current_price' in token 
      ? token.current_price 
      : (token as any).current_price || 0;
    const showPrice = Number.isFinite(currentPrice);
    
    const listLength = (selectedCategory === 'crypto' || selectedCategory === 'defi') ? topTokens.length : apiTrendingTokens.length;

    return (
      <TouchableOpacity
        key={token.id || `${token.symbol}-${index}`}
        style={[
          styles.assetRow,
          index < listLength - 1 && styles.assetRowDivider,
        ]}
        onPress={() => handleTokenPress(token)}
        activeOpacity={0.75}
      >
        <View style={styles.assetIcon}>
          {token.image ? (
            <Image 
              source={{ uri: token.image }} 
              style={styles.assetIconImage}
            />
          ) : (
            <Ionicons name="ellipse" size={20} color={colors.textTertiary} style={styles.iconGlyph} />
          )}
        </View>

        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: colors.textPrimary }]}>{token.name}</Text>
          {(selectedCategory === 'crypto' || selectedCategory === 'defi') && (
            <Text style={[styles.assetMetaText, { color: colors.textSecondary }]}>
              #{(token as CoinInfo).market_cap_rank || 'N/A'}
            </Text>
          )}
        </View>

        <View style={styles.assetMetrics}>
          {showPrice && (
            <Text style={[styles.assetPrice, { color: colors.textPrimary }]}>
              {formatCurrency(currentPrice)}
            </Text>
          )}
          <View style={styles.assetChangeRow}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={[styles.assetChangeText, { color: priceChange.color }]}>
              {priceChange.value}%
            </Text>
          </View>
          <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
            {token.symbol}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDAppItem = (dapp: DApp, index: number) => {
    return (
      <TouchableOpacity
        key={dapp.id}
        style={[
          styles.dappRow,
          index < dapps.length - 1 && styles.assetRowDivider,
        ]}
        onPress={() => openDApp(dapp)}
        activeOpacity={0.75}
      >
        <View style={styles.dappIcon}>
          {dapp.icon ? (
            <Image 
              source={{ uri: dapp.icon }} 
              style={styles.dappIconImage}
            />
          ) : (
            <Ionicons name="apps" size={22} color={colors.textTertiary} style={styles.iconGlyph} />
          )}
        </View>

        <View style={styles.dappInfo}>
          <View style={styles.dappTitleRow}>
            <Text style={[styles.assetName, { color: colors.textPrimary }]}>{dapp.name}</Text>
            {dapp.trending && (
              <View style={styles.dappTrendingPill}>
                <Text style={styles.dappTrendingText}>
                  TRENDING
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.dappDescription, { color: colors.textSecondary }]}>
            {dapp.description}
          </Text>
          
          <View style={styles.dappStatsRow}>
            <View style={styles.dappStat}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={[styles.dappStatText, { color: colors.textSecondary }]}>
                {dapp.rating}
              </Text>
            </View>
            
            <View style={styles.dappStat}>
              <Ionicons name="people" size={12} color={colors.textTertiary} />
              <Text style={[styles.dappStatText, { color: colors.textSecondary }]}>
                {formatNumber(dapp.users)}
              </Text>
            </View>
            
            <View style={styles.dappCategoryPill}>
              <Text style={[styles.dappCategoryText, { color: colors.primary }]}>
                {dapp.category}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dappMeta}>
          <Text style={styles.dappVolume}>
            {formatVolume(dapp.volume_24h)}
          </Text>
          
          <TouchableOpacity
            style={styles.dappOpenButton}
            onPress={() => openDApp(dapp)}
            activeOpacity={0.75}
          >
            <Text style={styles.dappOpenText}>
              Open
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getStockLogoUri = (symbol: string) =>
    `https://financialmodelingprep.com/image-stock/${symbol?.toUpperCase()}.png`;

  const renderStockItem = (stock: TrendingStock, index: number) => {
    const priceChange = formatPriceChange(stock.changePercent);
    
    return (
      <TouchableOpacity
        key={stock.symbol}
        style={[
          styles.assetRow,
          index < stocks.length - 1 && styles.assetRowDivider,
        ]}
        onPress={() => {
          // Navigate to stock details if needed
          logger.logButtonPress('Stock', `view ${stock.symbol}`);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.assetIcon}>
          <Image 
            source={{ uri: getStockLogoUri(stock.symbol) }} 
            style={styles.assetIconImage}
            onError={() => {
              // Image error - will show broken image or fallback handled by React Native
            }}
          />
        </View>

        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: colors.textPrimary }]}>{stock.name}</Text>
          <Text style={[styles.assetMetaText, { color: colors.textSecondary }]}>
            {stock.exchange || 'MARKET'} • {stock.symbol}
          </Text>
        </View>

        <View style={styles.assetMetrics}>
          <Text style={[styles.assetPrice, { color: colors.textPrimary }]}>
            {formatCurrency(stock.price)}
          </Text>
          <View style={styles.assetChangeRow}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={[styles.assetChangeText, { color: priceChange.color }]}>
              {priceChange.value}%
            </Text>
          </View>
          <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
            Vol: {formatNumber(stock.volume)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderETFItem = (etf: { symbol: string; name: string; quote: InvestmentQuote }, index: number) => {
    const priceChange = formatPriceChange(etf.quote.changePercent);
    
    return (
      <TouchableOpacity
        key={etf.symbol}
        style={[
          styles.assetRow,
          index < etfs.length - 1 && styles.assetRowDivider,
        ]}
        onPress={() => {
          logger.logButtonPress('ETF', `view ${etf.symbol}`);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.assetIcon}>
          <Ionicons name="bar-chart" size={20} color={colors.textTertiary} style={styles.iconGlyph} />
        </View>

        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: colors.textPrimary }]}>{etf.name}</Text>
          <Text style={[styles.assetMetaText, { color: colors.textSecondary }]}>
            {etf.quote.exchange || 'MARKET'} • {etf.symbol}
          </Text>
        </View>

        <View style={styles.assetMetrics}>
          <Text style={[styles.assetPrice, { color: colors.textPrimary }]}>
            {formatCurrency(etf.quote.price)}
          </Text>
          <View style={styles.assetChangeRow}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={[styles.assetChangeText, { color: priceChange.color }]}>
              {priceChange.value}%
            </Text>
          </View>
          {etf.quote.dividendYield && (
            <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
              Yield: {etf.quote.dividendYield.toFixed(2)}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBondItem = (bond: { symbol: string; name: string; quote: InvestmentQuote }, index: number) => {
    const priceChange = formatPriceChange(bond.quote.changePercent);
    
    return (
      <TouchableOpacity
        key={bond.symbol}
        style={[
          styles.assetRow,
          index < bonds.length - 1 && styles.assetRowDivider,
        ]}
        onPress={() => {
          logger.logButtonPress('Bond', `view ${bond.symbol}`);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.assetIcon}>
          <Ionicons name="shield" size={20} color={colors.textTertiary} style={styles.iconGlyph} />
        </View>

        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: colors.textPrimary }]}>{bond.name}</Text>
          <Text style={[styles.assetMetaText, { color: colors.textSecondary }]}>
            {bond.quote.exchange || 'MARKET'} • {bond.symbol}
          </Text>
        </View>

        <View style={styles.assetMetrics}>
          <Text style={[styles.assetPrice, { color: colors.textPrimary }]}>
            {formatCurrency(bond.quote.price)}
          </Text>
          <View style={styles.assetChangeRow}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={[styles.assetChangeText, { color: priceChange.color }]}>
              {priceChange.value}%
            </Text>
          </View>
          {bond.quote.dividendYield && (
            <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>
              Yield: {bond.quote.dividendYield.toFixed(2)}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDAppCategories = () => {
    if (dappCategories.length === 0) return null;

    return (
      <View style={styles.dappCategoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedDappCategory === 'all' && styles.categoryChipSelected,
            ]}
            onPress={() => filterDAppsByCategory('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedDappCategory === 'all' && styles.categoryChipTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {dappCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedDappCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => filterDAppsByCategory(category)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedDappCategory === category && styles.categoryChipTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPaginationControls = () => {
    if ((selectedCategory !== 'crypto' && selectedCategory !== 'defi') || topTokens.length === 0) return null;

    return (
      <LiquidGlass variant="transparent" cornerRadius={18} elasticity={0.18} style={styles.borderlessCard} className="p-4">
        <View style={styles.paginationRow}>
          <Text style={[styles.paginationMeta, { color: colors.textSecondary }]}>
            Showing {topTokens.length} of {hasMorePages ? 'many' : totalTokens} tokens
          </Text>
          
          <View style={styles.paginationControls}>
            <Text style={[styles.paginationMeta, { color: colors.textSecondary }]}>
              Page {currentPage}
            </Text>
            
            {hasMorePages && (
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={loadNextPage}
                disabled={isLoadingTokens}
                activeOpacity={0.75}
              >
                {isLoadingTokens ? (
                  <LoadingSpinner size={16} color="#0F172A" />
                ) : (
                  <>
                    <Text style={[styles.paginationButtonText, { color: colors.textPrimary }]}>
                      Next
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#0F172A" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LiquidGlass>
    );
  };

  const buildTokenForDetails = (token: NormalizedTrendingToken | CoinInfo): Token => ({
    address: (token as any).contract_address || token.id || `token-${token.symbol}`,
    symbol: token.symbol?.toUpperCase?.() || 'TOKEN',
    name: token.name || token.symbol?.toUpperCase?.() || 'Token',
    decimals: 18,
    logoURI: token.image,
    price: (token as any).current_price ?? ('current_price' in token ? token.current_price : 0),
    priceChange24h:
      (token as any).price_change_percentage_24h ?? ('price_change_percentage_24h' in token ? token.price_change_percentage_24h : 0),
  });

  const handleTokenPress = (token: NormalizedTrendingToken | CoinInfo) => {
    const builtToken = buildTokenForDetails(token);
    navigation.navigate('TokenDetails', { token: builtToken });
  };

  const handleViewDetailedList = () => {
    logger.logButtonPress('Trending Tokens', 'view detailed list');
    navigation.navigate('TrendingTokens');
  };

  const handleCategoryPress = (category: 'all' | 'crypto' | 'defi' | 'stocks' | 'bonds' | 'etfs' | 'dapps' | 'collections') => {
    setSelectedCategory(category);
    logger.logButtonPress('Search Category', `switch to ${category}`);
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.headerEyebrow}>Discover</Text>
          <Text style={styles.headerTitle}>Search the Bridge</Text>
          <Text style={styles.headerSubtitle}>
            Explore tokens, DApps, and curated collections ready for RuneKey’s hybrid crypto and equity flows.
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[styles.sectionWrapper, searchBarAnimatedStyle]}>
          <LiquidGlass
            variant="transparent"
            cornerRadius={24}
            elasticity={0.18}
            style={styles.transparentCard}
            className="p-1"
          >
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search tokens, DApps, NFTs..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={[styles.clearButton, { backgroundColor: colors.backgroundTertiary }]} activeOpacity={0.75}>
                  <Ionicons name="close" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </LiquidGlass>
        </Animated.View>

        {/* Category Filters */}
        <Animated.View style={[styles.sectionWrapper, categoriesAnimatedStyle]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {[
              { key: 'all', label: 'All', icon: 'grid-outline' },
              { key: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
              { key: 'defi', label: 'DeFi', icon: 'swap-horizontal-outline' },
              { key: 'stocks', label: 'Stocks', icon: 'trending-up-outline' },
              { key: 'bonds', label: 'Bonds', icon: 'shield-outline' },
              { key: 'etfs', label: 'ETFs', icon: 'bar-chart-outline' },
              { key: 'dapps', label: 'DApps', icon: 'apps-outline' },
              { key: 'collections', label: 'Collections', icon: 'images-outline' },
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.key && styles.categoryChipSelected,
                ]}
                onPress={() => handleCategoryPress(category.key as any)}
                activeOpacity={0.75}
              >
                <View style={styles.categoryChipContent}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={selectedCategory === category.key ? colors.textInverse : colors.textTertiary} 
                    style={styles.categoryChipIcon}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === category.key ? colors.textInverse : colors.textTertiary },
                    ]}
                  >
                    {category.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Content based on selected category */}
        {selectedCategory === 'crypto' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Crypto</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Live market leaders ranked by market cap</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingTokens && topTokens.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading crypto tokens..."
                  size="medium"
                  variant="inline"
                />
              ) : topTokens.length > 0 ? (
                <View style={styles.assetList}>
                  {topTokens.map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="logo-bitcoin" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No crypto tokens available
                  </Text>
                </View>
              )}
            </LiquidGlass>

            {renderPaginationControls()}
          </Animated.View>
        ) : selectedCategory === 'defi' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>DeFi Tokens</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Decentralized finance protocols and tokens</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingTokens && topTokens.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading DeFi tokens..."
                  size="medium"
                  variant="inline"
                />
              ) : topTokens.length > 0 ? (
                <View style={styles.assetList}>
                  {topTokens.map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="swap-horizontal-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No DeFi tokens available
                  </Text>
                </View>
              )}
            </LiquidGlass>

            {renderPaginationControls()}
          </Animated.View>
        ) : selectedCategory === 'stocks' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Stocks</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Top market movers from major exchanges</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingStocks && stocks.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading stocks..."
                  size="medium"
                  variant="inline"
                />
              ) : stocks.length > 0 ? (
                <View style={styles.assetList}>
                  {stocks.map((stock, index) => renderStockItem(stock, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-up-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No stocks available
                  </Text>
                </View>
              )}
            </LiquidGlass>
          </Animated.View>
        ) : selectedCategory === 'etfs' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Exchange-Traded Funds</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Popular ETFs with live pricing</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingEtfs && etfs.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading ETFs..."
                  size="medium"
                  variant="inline"
                />
              ) : etfs.length > 0 ? (
                <View style={styles.assetList}>
                  {etfs.map((etf, index) => renderETFItem(etf, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No ETFs available
                  </Text>
                </View>
              )}
            </LiquidGlass>
          </Animated.View>
        ) : selectedCategory === 'bonds' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bond ETFs</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Fixed income securities and bond funds</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingBonds && bonds.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading bonds..."
                  size="medium"
                  variant="inline"
                />
              ) : bonds.length > 0 ? (
                <View style={styles.assetList}>
                  {bonds.map((bond, index) => renderBondItem(bond, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No bonds available
                  </Text>
                </View>
              )}
            </LiquidGlass>
          </Animated.View>
        ) : selectedCategory === 'dapps' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Decentralized Apps</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Trusted tools hand-picked for RuneKey users</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {renderDAppCategories()}

              {isLoadingDapps && dapps.length === 0 ? (
                <CustomLoadingAnimation
                  message="Loading DApps..."
                  size="medium"
                  variant="inline"
                />
              ) : dapps.length > 0 ? (
                <View style={styles.assetList}>
                  {dapps.map((dapp, index) => renderDAppItem(dapp, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="apps-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No DApps available
                  </Text>
                </View>
              )}
            </LiquidGlass>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              variant="transparent"
              cornerRadius={24}
              elasticity={0.2}
              style={styles.borderlessCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Tokens</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Updated {lastUpdated ? formatTime(lastUpdated) : 'just now'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.sectionActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color={colors.textInverse} style={styles.sectionActionIcon} />
                  <Text style={[styles.sectionActionText, { color: colors.textInverse }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingTrending ? (
                <CustomLoadingAnimation
                  message="Loading trending tokens..."
                  size="medium"
                  variant="inline"
                />
              ) : apiTrendingTokens.length > 0 ? (
                <View style={styles.assetList}>
                  {apiTrendingTokens.slice(0, 5).map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-down" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No trending tokens available
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.sectionLink} onPress={handleViewDetailedList} activeOpacity={0.75}>
                <Text style={[styles.sectionLinkText, { color: colors.primary }]}>
                  View detailed list
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#38BDF8" />
              </TouchableOpacity>
            </LiquidGlass>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerEyebrow: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  sectionWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  horizontalScrollContent: {
    paddingRight: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  transparentCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  borderlessCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  categoryChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  categoryChipSelected: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipIcon: {
    marginRight: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryChipTextSelected: {
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
  },
  sectionActionIcon: {
    marginRight: 6,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  assetList: {
    gap: 4,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
  },
  paginationGlass: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  paginationMeta: {
    fontSize: 13,
    color: '#94A3B8',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  assetRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconGlyph: {
    backgroundColor: 'transparent',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assetMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  assetMetrics: {
    alignItems: 'flex-end',
    gap: 4,
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assetChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assetSymbol: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  dappRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dappIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dappInfo: {
    flex: 1,
  },
  dappTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dappTrendingPill: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dappTrendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FBBF24',
  },
  dappDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  dappStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dappStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dappStatText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dappCategoryPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dappCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
  },
  dappMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  dappVolume: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dappOpenButton: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  dappOpenText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  dappCategoryContainer: {
    marginBottom: 16,
  },
  sectionLink: {
    marginTop: 24,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLinkText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
});