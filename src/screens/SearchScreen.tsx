import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Modal, FlatList, Dimensions } from 'react-native';
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
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { LiquidGlass, LoadingSpinner } from '../components';

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

  // Fetch trending tokens from API
  const fetchTrendingTokens = async () => {
    setIsLoadingTrending(true);
    try {
      const result = await priceService.fetchTrendingTokens();
      if (result.success && result.data.length > 0) {
        // Transform the trending data to match our expected format
        const transformedTokens = result.data.map((coin: any, index: number) => ({
          id: coin.item?.id || `trending-${index}`,
          symbol: coin.item?.symbol?.toUpperCase() || 'UNKNOWN',
          name: coin.item?.name || 'Unknown Token',
          image: coin.item?.large || coin.item?.thumb || '',
          current_price: coin.item?.price_btc || 0,
          price_change_percentage_24h: coin.item?.data?.price_change_percentage_24h?.usd || 0,
        }));
        setApiTrendingTokens(transformedTokens);
        setLastUpdated(new Date());
      } else {
        setApiTrendingTokens([]);
      }
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      // Set empty array on error to avoid undefined state
      setApiTrendingTokens([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  // Start auto-refresh for trending tokens
  const startAutoRefresh = () => {
    // Clear existing interval
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    
    // Set new interval to refresh every 2 minutes
    const interval = setInterval(() => {
      fetchTrendingTokens();
    }, 2 * 60 * 1000); // 2 minutes
    
    setAutoRefreshInterval(interval);
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }
  };

  // Fetch trending tokens on mount
  useEffect(() => {
    fetchTrendingTokens();
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, []);

  const handleRefresh = () => {
    fetchTrendingTokens();
  };

  const handleCategoryPress = (category: 'all' | 'tokens' | 'dapps' | 'collections') => {
    setSelectedCategory(category);
    logger.logButtonPress('Search Category', `switch to ${category}`);
  };

  const handleTokenPress = (token: TrendingToken) => {
    logger.logButtonPress('Trending Token', `view ${token.symbol} details`);
    navigation.navigate('TokenDetails', { 
      token: {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        image: token.image,
        current_price: token.current_price,
        price_change_percentage_24h: token.price_change_percentage_24h,
      }
    });
  };

  const formatPriceChange = (change: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';
    const icon = isPositive ? 'trending-up' : 'trending-down';
    return { color, icon, value: Math.abs(change).toFixed(2) };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
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
        <View style={{ position: 'absolute', top: 50, right: 40, width: 150, height: 150, backgroundColor: '#3b82f6', borderRadius: 75 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 60, width: 100, height: 100, backgroundColor: '#10b981', borderRadius: 50 }} />
      </View>

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
            color: '#1e293b',
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
            <Ionicons name="search" size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#1e293b',
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
              { key: 'nfts', label: 'NFTs', icon: 'diamond-outline' },
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

        {/* Enhanced Trending Tokens Section */}
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
                color: '#1e293b',
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
                color: '#64748b',
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
                  color: '#64748b',
                  marginTop: 16,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  Loading trending tokens...
                </Text>
              </View>
            ) : apiTrendingTokens.length > 0 ? (
              <View>
                {apiTrendingTokens.slice(0, 5).map((token, index) => {
                  const priceChange = formatPriceChange(token.price_change_percentage_24h);
                  return (
                    <TouchableOpacity
                      key={token.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 16,
                        borderBottomWidth: index < apiTrendingTokens.length - 1 ? 1 : 0,
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
                        backgroundColor: '#f1f5f9',
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
                          color: '#1e293b',
                          marginBottom: 4,
                        }}>
                          {token.name}
                        </Text>
                      </View>

                      {/* Price Change */}
                      <View style={{ alignItems: 'flex-end' }}>
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
                          color: '#64748b',
                        }}>
                          {token.symbol}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Ionicons name="trending-down" size={48} color="#94a3b8" />
                <Text style={{
                  color: '#64748b',
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
      </ScrollView>
    </SafeAreaView>
  );
};