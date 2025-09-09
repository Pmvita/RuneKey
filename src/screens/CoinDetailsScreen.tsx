import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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

type Timeframe = '1D' | '1W' | '1M' | '1Y';

interface CoinDetailsRouteParams {
  coin: CoinInfo;
}

export const CoinDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { coin } = route.params as CoinDetailsRouteParams;
  
  const [coinData, setCoinData] = useState<CoinInfo>(coin);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const priceOpacity = useSharedValue(0);
  const priceScale = useSharedValue(0.8);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(50);

  // Load detailed coin data
  const loadCoinData = async () => {
    setIsLoading(true);
    try {
      // Try to get more detailed data for this specific coin
      const response = await priceService.fetchCoinInfo(coin.id);
      if (response.success && response.data) {
        setCoinData(response.data);
        
        // Save live price to cache
        if (response.data.current_price && response.data.current_price > 0) {
          await priceCacheService.saveLastLivePrice(response.data.symbol, response.data.current_price);
        }
      } else {
        // Fallback to cached price if available
        const cachedPrice = await priceCacheService.getLastLivePrice(coin.symbol);
        if (cachedPrice) {
          setCoinData(prev => ({
            ...prev,
            current_price: cachedPrice
          }));
        }
      }
    } catch (error) {
      console.error('❌ Error loading coin data:', error);
      
      // Fallback to cached price if available
      try {
        const cachedPrice = await priceCacheService.getLastLivePrice(coin.symbol);
        if (cachedPrice) {
          setCoinData(prev => ({
            ...prev,
            current_price: cachedPrice
          }));
        }
      } catch (cacheError) {
        console.error('❌ Error loading cached price:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoinData();
    setRefreshing(false);
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    logger.logButtonPress('Favorite Toggle', `toggle favorite for ${coin.symbol}`);
  };

  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    logger.logButtonPress('Timeframe Select', `select ${timeframe} timeframe`);
  };

  // Calculate price change based on timeframe
  const getPriceChange = () => {
    const change = coinData.price_change_percentage_24h || 0;
    return {
      percentage: change,
      isPositive: change >= 0,
      formatted: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    };
  };

  // Generate sparkline data based on timeframe
  const getSparklineData = () => {
    const basePrice = coinData.current_price || 0;
    const change = getPriceChange().percentage;
    
    // Generate mock sparkline data based on price change
    const dataPoints = 30;
    const data = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1);
      const variation = (Math.random() - 0.5) * 0.1; // Random variation
      const price = basePrice * (1 + (change / 100) * progress + variation);
      data.push(Math.max(price, basePrice * 0.5)); // Ensure minimum price
    }
    
    return data;
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const priceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceOpacity.value,
    transform: [{ scale: priceScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  // Animate on mount
  useEffect(() => {
    const animateIn = () => {
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withTiming(0, { duration: 600 });
      
      priceOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      priceScale.value = withDelay(200, withSpring(1, { damping: 15 }));
      
      statsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      statsTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
    };

    animateIn();
  }, []);

  // Load data on mount
  useEffect(() => {
    loadCoinData();
  }, []);

  const priceChange = getPriceChange();
  const sparklineData = getSparklineData();

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <LoadingOverlay visible={isLoading} />
        {showParticles && <ParticleEffect />}
        
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[{ paddingHorizontal: 20, paddingTop: 10 }, headerAnimatedStyle]}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 20 
            }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <Image
                  source={{ uri: coinData.image }}
                  style={{ width: 32, height: 32, marginRight: 12 }}
                />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
                  {coinData.name}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={toggleFavorite}
                style={{ padding: 8 }}
              >
                <Ionicons 
                  name={isFavorite ? "star" : "star-outline"} 
                  size={24} 
                  color={isFavorite ? "#f59e0b" : "#64748b"} 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Price Section */}
          <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 30 }, priceAnimatedStyle]}>
            <Text style={{ 
              fontSize: 48, 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: 8 
            }}>
              {formatLargeCurrency(coinData.current_price || 0)}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons 
                name={priceChange.isPositive ? "trending-up" : "trending-down"} 
                size={20} 
                color={priceChange.isPositive ? "#10b981" : "#ef4444"} 
              />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: priceChange.isPositive ? "#10b981" : "#ef4444",
                marginLeft: 8 
              }}>
                {priceChange.formatted}
              </Text>
            </View>

            {/* Sparkline Chart */}
            <View style={{ height: 120, marginBottom: 20 }}>
              <SparklineChart
                data={sparklineData}
                color={priceChange.isPositive ? "#10b981" : "#ef4444"}
                height={120}
                width={screenWidth - 40}
              />
            </View>

            {/* Timeframe Selector */}
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: '#f1f5f9', 
              borderRadius: 8, 
              padding: 4,
              marginBottom: 30 
            }}>
              {(['1D', '1W', '1M', '1Y'] as Timeframe[]).map((timeframe) => (
                <TouchableOpacity
                  key={timeframe}
                  style={{
                    flex: 1,
                    backgroundColor: selectedTimeframe === timeframe ? '#1e293b' : 'transparent',
                    borderRadius: 6,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                  onPress={() => handleTimeframeSelect(timeframe)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: selectedTimeframe === timeframe ? '#ffffff' : '#64748b',
                  }}>
                    {timeframe}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 30 }, statsAnimatedStyle]}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              gap: 12 
            }}>
              {[
                { label: 'Send', icon: 'arrow-up', onPress: () => logger.logButtonPress('Send', 'send crypto') },
                { label: 'Receive', icon: 'arrow-down', onPress: () => logger.logButtonPress('Receive', 'receive crypto') },
                { label: 'Buy', icon: 'add', onPress: () => logger.logButtonPress('Buy', 'buy crypto') },
                { label: 'Sell', icon: 'remove', onPress: () => logger.logButtonPress('Sell', 'sell crypto') },
                { label: 'Swap', icon: 'swap-horizontal', onPress: () => logger.logButtonPress('Swap', 'swap crypto') },
              ].map((action, index) => (
                <TouchableOpacity
                  key={action.label}
                  style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={action.onPress}
                >
                  <Ionicons 
                    name={action.icon as any} 
                    size={24} 
                    color={action.label === 'Sell' ? '#94a3b8' : '#1e293b'} 
                  />
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: '600', 
                    color: action.label === 'Sell' ? '#94a3b8' : '#1e293b',
                    marginTop: 4 
                  }}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Price Statistics */}
          <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 20 }, statsAnimatedStyle]}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: 16 
            }}>
              PRICE STATISTICS
            </Text>
            
            <View style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: 12, 
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Price</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginRight: 8 }}>
                    {formatLargeCurrency(coinData.current_price || 0)}
                  </Text>
                  <Ionicons 
                    name={priceChange.isPositive ? "trending-up" : "trending-down"} 
                    size={16} 
                    color={priceChange.isPositive ? "#10b981" : "#ef4444"} 
                  />
                  <Text style={{ 
                    fontSize: 14, 
                    color: priceChange.isPositive ? "#10b981" : "#ef4444",
                    marginLeft: 4 
                  }}>
                    {priceChange.formatted}
                  </Text>
                </View>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Trading volume</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {formatLargeCurrency(coinData.total_volume || 0)}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>24h Low / 24h High</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {formatLargeCurrency(coinData.low_24h || 0)} / {formatLargeCurrency(coinData.high_24h || 0)}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>All time high</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {formatLargeCurrency(coinData.ath || 0)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Market Cap */}
          <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 20 }, statsAnimatedStyle]}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: 16 
            }}>
              MARKET CAP
            </Text>
            
            <View style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: 12, 
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Market cap</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {formatLargeCurrency(coinData.market_cap || 0)}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Market cap rank</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  #{coinData.market_cap_rank || 'N/A'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Supply */}
          <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 40 }, statsAnimatedStyle]}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: 16 
            }}>
              SUPPLY
            </Text>
            
            <View style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: 12, 
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Circulating supply</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {coinData.circulating_supply ? `${coinData.circulating_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'N/A'}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Total supply</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {coinData.total_supply ? `${coinData.total_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'N/A'}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Max supply</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                  {coinData.max_supply ? `${coinData.max_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}` : 'N/A'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};