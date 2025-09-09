import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { 
  UniversalBackground,
  LoadingOverlay,
  ParticleEffect,
  SparklineChart
} from '../components';
import { priceService, CoinInfo } from '../services/api/priceService';
import { priceCacheService } from '../services/priceCacheService';
import { logger } from '../utils/logger';
import { formatLargeCurrency } from '../utils/formatters';

const { width: screenWidth } = Dimensions.get('window');

type SortOption = 'market_cap_rank' | 'price_change_percentage_24h' | 'market_cap';
type SortOrder = 'asc' | 'desc';

export const MarketScreen: React.FC = () => {
  const navigation = useNavigation();
  const [marketData, setMarketData] = useState<CoinInfo[]>([]);
  const [filteredData, setFilteredData] = useState<CoinInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('market_cap_rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(30);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  // Load market data
  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      const response = await priceService.fetchTopCoins(100);
      if (response.success && response.data) {
        // Save live prices to cache for fallback
        await Promise.all(response.data.map(async (coin) => {
          if (coin.current_price && coin.current_price > 0) {
            await priceCacheService.saveLastLivePrice(coin.symbol, coin.current_price);
          }
        }));
        
        setMarketData(response.data);
        setFilteredData(response.data);
        console.log('📊 Loaded market data:', response.data.length, 'coins');
      } else {
        console.error('❌ Failed to load market data:', response.error);
        
        // Try to use cached prices as fallback
        const cachedPrices = await priceCacheService.getAllCachedPrices();
        if (Object.keys(cachedPrices).length > 0) {
          console.log('⚠️ Using fallback market data from cache');
          // Create fallback market data from cached prices
          const fallbackData: CoinInfo[] = Object.entries(cachedPrices).map(([symbol, price], index) => ({
            id: symbol.toLowerCase(),
            symbol: symbol.toUpperCase(),
            name: symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase(),
            current_price: price,
            market_cap: 0,
            market_cap_rank: index + 1,
            price_change_percentage_24h: 0,
            image: `https://assets.coingecko.com/coins/images/1/large/${symbol.toLowerCase()}.png`,
            sparkline_in_7d: { price: [] }
          }));
          
          setMarketData(fallbackData);
          setFilteredData(fallbackData);
          Alert.alert('Using Cached Data', 'Market data is temporarily unavailable. Showing cached prices.');
        } else {
          Alert.alert('Error', 'Failed to load market data. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error loading market data:', error);
      
      // Try to use cached prices as fallback
      try {
        const cachedPrices = await priceCacheService.getAllCachedPrices();
        if (Object.keys(cachedPrices).length > 0) {
          console.log('⚠️ Using fallback market data from cache due to error');
          // Create fallback market data from cached prices
          const fallbackData: CoinInfo[] = Object.entries(cachedPrices).map(([symbol, price], index) => ({
            id: symbol.toLowerCase(),
            symbol: symbol.toUpperCase(),
            name: symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase(),
            current_price: price,
            market_cap: 0,
            market_cap_rank: index + 1,
            price_change_percentage_24h: 0,
            image: `https://assets.coingecko.com/coins/images/1/large/${symbol.toLowerCase()}.png`,
            sparkline_in_7d: { price: [] }
          }));
          
          setMarketData(fallbackData);
          setFilteredData(fallbackData);
          Alert.alert('Using Cached Data', 'Network error occurred. Showing cached prices.');
        } else {
          Alert.alert('Error', 'Network error. Please check your connection.');
        }
      } catch (cacheError) {
        console.error('❌ Error loading cached prices:', cacheError);
        Alert.alert('Error', 'Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort data
  const filterAndSortData = useCallback(() => {
    let filtered = [...marketData];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(coin => 
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter(coin => favorites.has(coin.id));
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'market_cap_rank':
          aValue = a.market_cap_rank || 999999;
          bValue = b.market_cap_rank || 999999;
          break;
        case 'price_change_percentage_24h':
          aValue = a.price_change_percentage_24h || 0;
          bValue = b.price_change_percentage_24h || 0;
          break;
        case 'market_cap':
          aValue = a.market_cap || 0;
          bValue = b.market_cap || 0;
          break;
        default:
          aValue = a.market_cap_rank || 999999;
          bValue = b.market_cap_rank || 999999;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredData(filtered);
  }, [marketData, searchQuery, showFavorites, favorites, sortBy, sortOrder]);

  // Load data on mount
  useEffect(() => {
    loadMarketData();
  }, []);

  // Filter and sort when dependencies change
  useEffect(() => {
    filterAndSortData();
  }, [filterAndSortData]);

  // Animate on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    
    setTimeout(() => {
      listOpacity.value = withTiming(1, { duration: 800 });
      listTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, 200);
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  // Toggle favorite
  const toggleFavorite = (coinId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(coinId)) {
      newFavorites.delete(coinId);
    } else {
      newFavorites.add(coinId);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 2000);
    }
    setFavorites(newFavorites);
    logger.logButtonPress('Favorite', `toggle ${coinId}`);
  };

  // Handle sort
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
    logger.logButtonPress('Sort', `${option} ${sortOrder}`);
  };

  // Generate sparkline data
  const generateSparklineData = (priceChange: number) => {
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
          visible={isLoading}
          message="Loading Market Data..."
          spinnerSize={80}
          spinnerColor="#3B82F6"
        />
        
        {/* Particle Effects */}
        <ParticleEffect 
          type="confetti" 
          active={showParticles} 
          onComplete={() => setShowParticles(false)}
        />

        {/* Header */}
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
                color: '#1e293b',
                marginRight: 12,
              }}>
                Wallet
              </Text>
              <TouchableOpacity
                style={{
                  padding: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Balance Visibility', 'toggle visibility');
                }}
              >
                <Ionicons name="eye" size={20} color="#64748b" />
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
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
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
                <Ionicons name="trending-up-outline" size={20} color="#64748b" />
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
                <Ionicons name="notifications-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: 8,
                }}
                onPress={() => {
                  logger.logButtonPress('Settings', 'open settings');
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Crypto/Market Tabs */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f1f5f9',
            borderRadius: 8,
            padding: 2,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#f1f5f9',
                borderRadius: 6,
                paddingVertical: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                logger.logButtonPress('Crypto Tab', 'switch to crypto view');
                navigation.navigate('MainTabs' as never);
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#64748b',
              }}>
                Crypto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#1e293b',
                borderRadius: 6,
                paddingVertical: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                logger.logButtonPress('Market Tab', 'switch to market view');
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Market
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: '#1e293b',
              }}
              placeholder="Search"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Filter Options */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 16 }, headerAnimatedStyle]}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: showFavorites ? '#3b82f6' : '#f1f5f9',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              onPress={() => setShowFavorites(!showFavorites)}
            >
              <Ionicons 
                name="star" 
                size={16} 
                color={showFavorites ? '#ffffff' : '#64748b'} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              onPress={() => handleSort('market_cap_rank')}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#64748b',
                marginRight: 4,
              }}>
                Sort Rank {sortBy === 'market_cap_rank' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              onPress={() => handleSort('price_change_percentage_24h')}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#64748b',
              }}>
                Time 1Y
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#64748b',
              }}>
                Currency USD
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Market Data List */}
        <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
          <ScrollView 
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredData.map((coin, index) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              const sparklineData = generateSparklineData(coin.price_change_percentage_24h);
              
              return (
                <TouchableOpacity
                  key={coin.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderBottomWidth: index < filteredData.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
                  }}
                  onPress={() => {
                    logger.logButtonPress(`${coin.symbol} Coin`, 'view coin details');
                    navigation.navigate('CoinDetails' as never, { coin } as never);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Coin Icon */}
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Image 
                      source={{ uri: coin.image }} 
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                    />
                  </View>

                  {/* Coin Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: 2,
                    }}>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#64748b',
                    }}>
                      {coin.market_cap_rank} {formatLargeCurrency(coin.market_cap)}
                    </Text>
                  </View>

                  {/* Price and Change */}
                  <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: 2,
                    }}>
                      ${coin.current_price.toLocaleString()}
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
                        {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Sparkline Chart */}
                  <View style={{ width: 60, height: 30 }}>
                    <SparklineChart
                      data={sparklineData}
                      width={60}
                      height={30}
                      color={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Empty State */}
            {filteredData.length === 0 && !isLoading && (
              <View style={{
                padding: 32,
                alignItems: 'center',
              }}>
                <Ionicons name="search" size={48} color="#94a3b8" />
                <Text style={{
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 16,
                }}>
                  {searchQuery ? 'No coins found matching your search' : 'No market data available'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </UniversalBackground>
  );
};
