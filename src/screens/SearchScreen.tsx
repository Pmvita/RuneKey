import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Modal, FlatList, Dimensions, Linking } from 'react-native';
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
    
    return (
      <TouchableOpacity
        key={token.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: index < (selectedCategory === 'tokens' ? topTokens.length : apiTrendingTokens.length) - 1 ? 1 : 0,
          borderBottomColor: 'rgba(148, 163, 184, 0.2)',
        }}
        onPress={() => handleTokenPress(token)}
        activeOpacity={0.7}
      >
        {/* Token Icon */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#0b1120',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          {token.image ? (
            <Image 
              source={{ uri: token.image }} 
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          ) : (
            <Ionicons name="ellipse" size={24} color="#94a3b8" />
          )}
        </View>

        {/* Token Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 4,
          }}>
            {token.name}
          </Text>
          {selectedCategory === 'tokens' && (
            <Text style={{
              fontSize: 12,
              color: '#94A3B8',
            }}>
              #{(token as CoinInfo).market_cap_rank || 'N/A'}
            </Text>
          )}
        </View>

        {/* Price Info */}
        <View style={{ alignItems: 'flex-end' }}>
          {selectedCategory === 'tokens' && (
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#FFFFFF',
              marginBottom: 4,
            }}>
              {formatCurrency(currentPrice)}
            </Text>
          )}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <Ionicons name={priceChange.icon as any} size={12} color={priceChange.color} />
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: priceChange.color,
              marginLeft: 4,
            }}>
              {priceChange.value}%
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#94A3B8',
          }}>
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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: index < dapps.length - 1 ? 1 : 0,
          borderBottomColor: 'rgba(148, 163, 184, 0.2)',
        }}
        onPress={() => openDApp(dapp)}
        activeOpacity={0.7}
      >
        {/* DApp Icon */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#0b1120',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          {dapp.icon ? (
            <Image 
              source={{ uri: dapp.icon }} 
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <Ionicons name="apps" size={24} color="#94a3b8" />
          )}
        </View>

        {/* DApp Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#FFFFFF',
              marginRight: 8,
            }}>
              {dapp.name}
            </Text>
            {dapp.trending && (
              <View style={{
                backgroundColor: 'rgba(250, 204, 21, 0.18)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: '#d97706',
                }}>
                  TRENDING
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{
            fontSize: 14,
            color: '#94A3B8',
            marginBottom: 4,
          }}>
            {dapp.description}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={{
                fontSize: 12,
                color: '#94A3B8',
                marginLeft: 4,
              }}>
                {dapp.rating}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="people" size={12} color="#94A3B8" />
              <Text style={{
                fontSize: 12,
                color: '#94A3B8',
                marginLeft: 4,
              }}>
                {formatNumber(dapp.users)}
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#dbeafe',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '600',
                color: '#2563eb',
              }}>
                {dapp.category}
              </Text>
            </View>
          </View>
        </View>

        {/* DApp Actions */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 12,
            color: '#94A3B8',
            marginBottom: 4,
          }}>
            {formatVolume(dapp.volume_24h)}
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: '#3b82f6',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
            onPress={() => openDApp(dapp)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#ffffff',
            }}>
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
      <View style={{ marginBottom: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: selectedDappCategory === 'all' ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginRight: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => filterDAppsByCategory('all')}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: selectedDappCategory === 'all' ? '#ffffff' : '#374151',
            }}>
              All
            </Text>
          </TouchableOpacity>
          
          {dappCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={{
                backgroundColor: selectedDappCategory === category ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => filterDAppsByCategory(category)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: selectedDappCategory === category ? '#ffffff' : '#374151',
              }}>
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
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginTop: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Text style={{
          fontSize: 14,
          color: '#94A3B8',
        }}>
          Showing {topTokens.length} of {hasMorePages ? 'many' : totalTokens} tokens
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: 14,
            color: '#94A3B8',
            marginRight: 8,
          }}>
            Page {currentPage}
          </Text>
          
          {hasMorePages && (
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={loadNextPage}
              disabled={isLoadingTokens}
              activeOpacity={0.7}
            >
              {isLoadingTokens ? (
                <LoadingSpinner size={16} color="#ffffff" />
              ) : (
                <>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#ffffff',
                    marginRight: 4,
                  }}>
                    Next
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
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
        {/* Enhanced Header */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }, headerAnimatedStyle]}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5,
          }}>
            Search
          </Text>
        </Animated.View>

        {/* Enhanced Search Bar */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, searchBarAnimatedStyle]}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 12 }} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#FFFFFF',
                backgroundColor: 'transparent',
              }}
              placeholder="Search tokens, DApps, NFTs..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Enhanced Category Filters */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 24 }, categoriesAnimatedStyle]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {[
              { key: 'all', label: 'All', icon: 'grid-outline' },
              { key: 'tokens', label: 'Tokens', icon: 'ellipse-outline' },
              { key: 'dapps', label: 'DApps', icon: 'apps-outline' },
              { key: 'collections', label: 'Collections', icon: 'images-outline' },
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                style={{
                  backgroundColor: selectedCategory === category.key ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  marginRight: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: selectedCategory === category.key ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
                }}
                onPress={() => handleCategoryPress(category.key as any)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={selectedCategory === category.key ? '#ffffff' : '#64748b'} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: selectedCategory === category.key ? '#ffffff' : '#374151',
                  }}>
                    {category.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Content based on selected category */}
        {selectedCategory === 'tokens' ? (
          <Animated.View style={[{ paddingHorizontal: 24 }, trendingAnimatedStyle]}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
            }}>
              {/* Section Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}>
                  Top Tokens
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#ffffff',
                  }}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tokens List */}
              {isLoadingTokens && topTokens.length === 0 ? (
                <View style={{ 
                  paddingVertical: 40, 
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={{
                    color: '#94A3B8',
                    marginTop: 16,
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    Loading top tokens...
                  </Text>
                </View>
              ) : topTokens.length > 0 ? (
                <View>
                  {topTokens.map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="ellipse-outline" size={48} color="#94a3b8" />
                  <Text style={{
                    color: '#94A3B8',
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 16,
                  }}>
                    No tokens available
                  </Text>
                </View>
              )}
            </View>
            
            {/* Pagination Controls */}
            {renderPaginationControls()}
          </Animated.View>
        ) : selectedCategory === 'dapps' ? (
          <Animated.View style={[{ paddingHorizontal: 24 }, trendingAnimatedStyle]}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
            }}>
              {/* Section Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}>
                  Decentralized Apps
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#ffffff',
                  }}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {/* DApp Categories */}
              {renderDAppCategories()}

              {/* DApps List */}
              {isLoadingDapps && dapps.length === 0 ? (
                <View style={{ 
                  paddingVertical: 40, 
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={{
                    color: '#94A3B8',
                    marginTop: 16,
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    Loading DApps...
                  </Text>
                </View>
              ) : dapps.length > 0 ? (
                <View>
                  {dapps.map((dapp, index) => renderDAppItem(dapp, index))}
                </View>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="apps-outline" size={48} color="#94a3b8" />
                  <Text style={{
                    color: '#94A3B8',
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 16,
                  }}>
                    No DApps available
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        ) : (
          /* Enhanced Trending Tokens Section for other categories */
          <Animated.View style={[{ paddingHorizontal: 24 }, trendingAnimatedStyle]}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
            }}>
              {/* Section Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}>
                  Trending Tokens
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#ffffff',
                  }}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Last Updated Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  marginRight: 8,
                }}>
                  Last updated: {lastUpdated ? formatTime(lastUpdated) : 'Never'}
                </Text>
                <View style={{
                  width: 6,
                  height: 6,
                  backgroundColor: '#22c55e',
                  borderRadius: 3,
                  marginRight: 6,
                }} />
                <Text style={{
                  fontSize: 12,
                  color: '#22c55e',
                  fontWeight: '600',
                }}>
                  Live
                </Text>
              </View>

              {/* Trending Tokens List */}
              {isLoadingTrending ? (
                <View style={{ 
                  paddingVertical: 40, 
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <LoadingSpinner size={32} color="#3B82F6" />
                  <Text style={{
                    color: '#94A3B8',
                    marginTop: 16,
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    Loading trending tokens...
                  </Text>
                </View>
              ) : apiTrendingTokens.length > 0 ? (
                <View>
                  {apiTrendingTokens.slice(0, 5).map((token, index) => renderTokenItem(token, index))}
                </View>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="trending-down" size={48} color="#94a3b8" />
                  <Text style={{
                    color: '#94A3B8',
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 16,
                  }}>
                    No trending tokens available
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};