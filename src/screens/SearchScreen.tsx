import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Modal, FlatList, Dimensions, Linking, StyleSheet } from 'react-native';
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
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { LiquidGlass, LoadingSpinner, UniversalBackground } from '../components';

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

interface TrendingToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tokens' | 'dapps' | 'collections'>('all');
  const [apiTrendingTokens, setApiTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showTrendingModal, setShowTrendingModal] = useState(false);
  
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

  // Fallback trending tokens data
  const getFallbackTrendingTokens = (): TrendingToken[] => [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      current_price: 110000,
      price_change_percentage_24h: 2.5,
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      current_price: 4300,
      price_change_percentage_24h: -1.2,
    },
    {
      id: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      current_price: 200,
      price_change_percentage_24h: 5.8,
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      current_price: 0.5,
      price_change_percentage_24h: 3.2,
    },
    {
      id: 'polkadot',
      symbol: 'DOT',
      name: 'Polkadot',
      image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      current_price: 8.5,
      price_change_percentage_24h: -0.8,
    },
  ];

  // Fetch trending tokens from API
  const fetchTrendingTokens = async () => {
    setIsLoadingTrending(true);
    try {
      const result = await priceService.fetchTrendingTokens();
      if (result.success && result.data.length > 0) {
        // Transform the trending data to match our expected format
        const transformedTokens: TrendingToken[] = result.data.map((token: any) => ({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          image: token.image,
          current_price: token.current_price || 0,
          price_change_percentage_24h: token.price_change_percentage_24h || 0,
        }));
        setApiTrendingTokens(transformedTokens);
        setLastUpdated(new Date());
      } else {
        // Use fallback data if API returns empty
        console.log('📊 Using fallback trending tokens data');
        setApiTrendingTokens(getFallbackTrendingTokens());
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      // Use fallback data on error
      console.log('📊 Using fallback trending tokens due to error');
      setApiTrendingTokens(getFallbackTrendingTokens());
      setLastUpdated(new Date());
    } finally {
      setIsLoadingTrending(false);
    }
  };

  // Fetch top tokens when tokens tab is selected
  useEffect(() => {
    if (selectedCategory === 'tokens' && topTokens.length === 0) {
      fetchTopTokens(1, false);
    }
  }, [selectedCategory]);

  // Fetch DApps when dapps tab is selected
  useEffect(() => {
    if (selectedCategory === 'dapps' && dapps.length === 0) {
      fetchDApps();
    }
  }, [selectedCategory]);

  // Fetch top tokens
  const fetchTopTokens = async (page: number = 1, append: boolean = false) => {
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
  };

  // Load next page of tokens
  const loadNextPage = () => {
    if (!isLoadingTokens && hasMorePages) {
      fetchTopTokens(currentPage + 1, true);
    }
  };

  // Fetch DApps
  const fetchDApps = async () => {
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
  };

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
    if (selectedCategory === 'tokens') {
      fetchTopTokens(1, false);
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

    setAutoRefreshInterval(interval);

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
    // Handle NaN, undefined, or null values
    if (isNaN(change) || change === null || change === undefined) {
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
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

  const renderTokenItem = (token: TrendingToken | CoinInfo, index: number) => {
    const priceChange = formatPriceChange(
      'price_change_percentage_24h' in token 
        ? token.price_change_percentage_24h 
        : (token as any).price_change_percentage_24h || 0
    );
    const currentPrice = 'current_price' in token 
      ? token.current_price 
      : (token as any).current_price || 0;
    
    const listLength = selectedCategory === 'tokens' ? topTokens.length : apiTrendingTokens.length;

    return (
      <TouchableOpacity
        key={token.id}
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
            <Ionicons name="ellipse" size={20} color="#94A3B8" style={styles.iconGlyph} />
          )}
        </View>

        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{token.name}</Text>
          {selectedCategory === 'tokens' && (
            <Text style={styles.assetMetaText}>
              #{(token as CoinInfo).market_cap_rank || 'N/A'}
            </Text>
          )}
        </View>

        <View style={styles.assetMetrics}>
          {selectedCategory === 'tokens' && (
            <Text style={styles.assetPrice}>
              {formatCurrency(currentPrice)}
            </Text>
          )}
          <View style={styles.assetChangeRow}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={[styles.assetChangeText, { color: priceChange.color }]}>
              {priceChange.value}%
            </Text>
          </View>
          <Text style={styles.assetSymbol}>
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
            <Ionicons name="apps" size={22} color="#94A3B8" style={styles.iconGlyph} />
          )}
        </View>

        <View style={styles.dappInfo}>
          <View style={styles.dappTitleRow}>
            <Text style={styles.assetName}>{dapp.name}</Text>
            {dapp.trending && (
              <View style={styles.dappTrendingPill}>
                <Text style={styles.dappTrendingText}>
                  TRENDING
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.dappDescription}>
            {dapp.description}
          </Text>
          
          <View style={styles.dappStatsRow}>
            <View style={styles.dappStat}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.dappStatText}>
                {dapp.rating}
              </Text>
            </View>
            
            <View style={styles.dappStat}>
              <Ionicons name="people" size={12} color="#94A3B8" />
              <Text style={styles.dappStatText}>
                {formatNumber(dapp.users)}
              </Text>
            </View>
            
            <View style={styles.dappCategoryPill}>
              <Text style={styles.dappCategoryText}>
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
    if (selectedCategory !== 'tokens' || topTokens.length === 0) return null;

    return (
      <LiquidGlass cornerRadius={18} elasticity={0.18} style={styles.paginationGlass} className="p-4">
        <View style={styles.paginationRow}>
          <Text style={styles.paginationMeta}>
            Showing {topTokens.length} of {hasMorePages ? 'many' : totalTokens} tokens
          </Text>
          
          <View style={styles.paginationControls}>
            <Text style={styles.paginationMeta}>
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
                    <Text style={styles.paginationButtonText}>
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

  const handleTokenPress = (token: TrendingToken | CoinInfo) => {
    navigation.navigate('TokenDetails', { tokenId: token.id });
  };

  const handleCategoryPress = (category: 'all' | 'tokens' | 'dapps' | 'collections') => {
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
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tokens, DApps, NFTs..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton} activeOpacity={0.75}>
                  <Ionicons name="close" size={18} color="#94A3B8" />
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
              { key: 'tokens', label: 'Tokens', icon: 'ellipse-outline' },
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
                    color={selectedCategory === category.key ? '#0F172A' : '#94A3B8'} 
                    style={styles.categoryChipIcon}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.key && styles.categoryChipTextSelected,
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
        {selectedCategory === 'tokens' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              style={styles.glassCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Top Tokens</Text>
                  <Text style={styles.sectionSubtitle}>Live market leaders ranked by market cap</Text>
                </View>
                <TouchableOpacity
                  style={styles.sectionActionButton}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color="#0F172A" style={styles.sectionActionIcon} />
                  <Text style={styles.sectionActionText}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingTokens && topTokens.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={styles.loadingText}>
                    Loading top tokens...
                  </Text>
                </View>
              ) : topTokens.length > 0 ? (
                <View style={styles.assetList}>
                  {topTokens.map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="ellipse-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>
                    No tokens available
                  </Text>
                </View>
              )}
            </LiquidGlass>

            {renderPaginationControls()}
          </Animated.View>
        ) : selectedCategory === 'dapps' ? (
          <Animated.View style={[styles.sectionWrapper, trendingAnimatedStyle]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              style={styles.glassCard}
              className="p-6"
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Decentralized Apps</Text>
                  <Text style={styles.sectionSubtitle}>Trusted tools hand-picked for RuneKey users</Text>
                </View>
                <TouchableOpacity
                  style={styles.sectionActionButton}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color="#0F172A" style={styles.sectionActionIcon} />
                  <Text style={styles.sectionActionText}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {renderDAppCategories()}

              {isLoadingDapps && dapps.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={styles.loadingText}>
                    Loading DApps...
                  </Text>
                </View>
              ) : dapps.length > 0 ? (
                <View style={styles.assetList}>
                  {dapps.map((dapp, index) => renderDAppItem(dapp, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="apps-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>
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
                  <Text style={styles.sectionTitle}>Trending Tokens</Text>
                  <Text style={styles.sectionSubtitle}>
                    Updated {lastUpdated ? formatTime(lastUpdated) : 'just now'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sectionActionButton}
                  onPress={handleRefresh}
                  activeOpacity={0.75}
                >
                  <Ionicons name="refresh" size={16} color="#0F172A" style={styles.sectionActionIcon} />
                  <Text style={styles.sectionActionText}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingTrending ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={styles.loadingText}>
                    Loading trending tokens...
                  </Text>
                </View>
              ) : apiTrendingTokens.length > 0 ? (
                <View style={styles.assetList}>
                  {apiTrendingTokens.slice(0, 5).map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-down" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>
                    No trending tokens available
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.sectionLink}
                onPress={() => setShowTrendingModal(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.sectionLinkText}>
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