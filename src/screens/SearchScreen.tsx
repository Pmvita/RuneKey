import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { priceService, CoinInfo } from '../services/api/priceService';
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { LiquidGlass } from '../components';

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

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SearchScreen');
    }, [])
  );

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
    startAutoRefresh(); // Start auto-refresh on mount
    return () => stopAutoRefresh(); // Clean up on unmount
  }, []);

  // Mock search results
  const searchResults: SearchResult[] = [
    {
      id: '1',
      type: 'token',
      name: 'Ethereum',
      symbol: 'ETH',
      description: 'Decentralized platform for smart contracts',
      icon: 'star',
      trending: true
    },
    {
      id: '2',
      type: 'token',
      name: 'Bitcoin',
      symbol: 'BTC',
      description: 'The first cryptocurrency',
      icon: 'cash',
      trending: true
    },
    {
      id: '3',
      type: 'token',
      name: 'USD Coin',
      symbol: 'USDC',
      description: 'Stablecoin pegged to the US Dollar',
      icon: 'cash-outline'
    },
    {
      id: '4',
      type: 'dapp',
      name: 'Uniswap',
      description: 'Decentralized exchange protocol',
      icon: 'swap-horizontal-outline',
      trending: true
    },
    {
      id: '5',
      type: 'collection',
      name: 'Bored Ape Yacht Club',
      description: 'Popular NFT collection',
      icon: 'image-outline'
    }
  ];

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'tokens', label: 'Tokens', icon: 'cash' },
    { id: 'dapps', label: 'DApps', icon: 'apps-outline' },
    { id: 'collections', label: 'NFTs', icon: 'image-outline' }
  ];

  const filteredResults = searchQuery 
    ? searchResults.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const categoryResults = selectedCategory === 'all' 
    ? searchResults 
    : searchResults.filter(item => 
        selectedCategory === 'tokens' ? item.type === 'token' :
        selectedCategory === 'dapps' ? item.type === 'dapp' :
        selectedCategory === 'collections' ? item.type === 'collection' :
        true
      );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'token':
        return 'text-blue-600';
      case 'dapp':
        return 'text-purple-600';
      case 'collection':
        return 'text-pink-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Background overlay */}
      <View 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(93,138,168)',
        }}
      />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6">
          <Text className="text-2xl font-bold text-slate-900 mb-4 text-center">
            Search
          </Text>
          
          {/* Search Input */}
          <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-3 bg-white">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tokens, DApps, NFTs..."
                placeholderTextColor="#6B7280"
                style={{ flex: 1, marginLeft: 12, color: '#374151' }}
              />
            </View>
          </View>
        </View>

        {/* Categories */}
        <View className="px-6 mb-6">
          <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 12 }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`flex-row items-center px-4 py-2 rounded-full border ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => setSelectedCategory(category.id as any)}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategory === category.id ? '#ffffff' : '#6b7280'} 
                    />
                    <Text 
                      className={`ml-2 font-medium ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Search Results or Default Content */}
        <View className="px-6">
          {searchQuery ? (
            // Search Results
            <>
              <Text className="text-lg font-semibold text-slate-900 mb-4">
                Results for "{searchQuery}"
              </Text>
              {filteredResults.length > 0 ? (
                <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  {filteredResults.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      className={`p-4 flex-row items-center ${
                        index !== filteredResults.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={24} color="#6b7280" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-base font-semibold text-slate-900">
                            {item.name}
                          </Text>
                          {item.symbol && (
                            <Text className="text-sm text-slate-600 ml-2">
                              {item.symbol}
                            </Text>
                          )}
                          {item.trending && (
                            <View className="ml-2 px-2 py-1 bg-orange-100 rounded">
                              <Text className="text-xs text-orange-600 font-medium">
                                Trending
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-slate-600 mt-1">
                          {item.description}
                        </Text>
                        <Text className={`text-xs font-medium mt-1 ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="p-8 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <View className="items-center">
                    <Ionicons name="search-outline" size={48} color="#6b7280" />
                    <Text className="text-lg font-semibold text-slate-700 mt-4 mb-2">
                      No Results Found
                    </Text>
                    <Text className="text-slate-600 text-center">
                      Try adjusting your search terms or browse categories below.
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            // Default Content
            <>
              {/* Trending Tokens */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-slate-900">
                    Trending Tokens
                  </Text>
                  <TouchableOpacity
                    onPress={fetchTrendingTokens}
                    className="flex-row items-center px-3 py-1 bg-blue-100 rounded-full"
                  >
                    <Ionicons name="refresh" size={16} color="#3b82f6" />
                    <Text className="text-xs text-blue-600 ml-1 font-medium">
                      Refresh
                    </Text>
                  </TouchableOpacity>
                </View>
                {lastUpdated && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-xs text-slate-500">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </Text>
                    <View className="flex-row items-center ml-2">
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      <Text className="text-xs text-green-600 font-medium">
                        Live
                      </Text>
                    </View>
                  </View>
                )}
                <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  {isLoadingTrending ? (
                    <View className="items-center py-8">
                      <Text className="text-slate-600">Loading trending tokens...</Text>
                    </View>
                  ) : apiTrendingTokens.length > 0 ? (
                    <>
                      {apiTrendingTokens.slice(0, 3).map((token, index) => (
                        <TouchableOpacity
                          key={`${token.symbol}-${index}`}
                          className={`p-4 flex-row items-center ${
                            index !== Math.min(apiTrendingTokens.length, 3) - 1 ? 'border-b border-gray-200' : ''
                          }`}
                        >
                          {token.image ? (
                            <Image 
                              source={{ uri: token.image }} 
                              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                              onError={() => {
                                console.log('Failed to load image for trending token:', token.symbol);
                              }}
                            />
                          ) : (
                            <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
                              <Ionicons name="cash" size={20} color="#6b7280" />
                            </View>
                          )}
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-base font-semibold text-slate-900">
                                {token.name}
                              </Text>
                              <Text className="text-sm text-slate-600">
                                {token.symbol?.toUpperCase()}
                              </Text>
                            </View>
                            {token.price_change_percentage_24h && (
                              <View className="flex-row items-center mt-1">
                                <Text className={`text-xs font-medium ${
                                  token.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {`${token.price_change_percentage_24h > 0 ? '+' : ''}${token.price_change_percentage_24h.toFixed(2)}%`}
                                </Text>
                                <Ionicons 
                                  name={token.price_change_percentage_24h > 0 ? 'trending-up' : 'trending-down'} 
                                  size={12} 
                                  color={token.price_change_percentage_24h > 0 ? '#16a34a' : '#dc2626'} 
                                  style={{ marginLeft: 4 }}
                                />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                      
                      {apiTrendingTokens.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setShowTrendingModal(true)}
                          className="p-4 border-t border-gray-200"
                        >
                          <View className="flex-row items-center justify-center">
                            <Text className="text-blue-600 font-medium mr-2">
                              See More ({apiTrendingTokens.length - 3} more)
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#2563eb" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View className="items-center py-8">
                      <Text className="text-slate-600">No trending tokens available</Text>
                      <Text className="text-xs text-slate-500 mt-2 text-center">
                        API rate limit reached. Try again later.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Browse Categories */}
              <View>
                <Text className="text-lg font-semibold text-slate-900 mb-4">
                  Browse by Category
                </Text>
                <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  {categoryResults.slice(0, 5).map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      className={`p-4 flex-row items-center ${
                        index !== Math.min(categoryResults.length, 5) - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={24} color="#6b7280" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-base font-semibold text-slate-900">
                            {item.name}
                          </Text>
                          {item.symbol && (
                            <Text className="text-sm text-slate-600 ml-2">
                              {item.symbol}
                            </Text>
                          )}
                        </View>
                        <Text className="text-sm text-slate-600 mt-1">
                          {item.description}
                        </Text>
                        <Text className={`text-xs font-medium mt-1 ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Additional Space */}
        <View className="h-6" />
      </ScrollView>

      {/* Trending Tokens Modal */}
      <Modal
        visible={showTrendingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-slate-900">
              All Trending Tokens
            </Text>
            <TouchableOpacity
              onPress={() => setShowTrendingModal(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Token List */}
          <FlatList
            data={apiTrendingTokens}
            keyExtractor={(item) => `${item.symbol}-${item.id}`}
            renderItem={({ item }: { item: TrendingToken }) => (
              <TouchableOpacity
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => {
                  setShowTrendingModal(false);
                  navigation.navigate('TokenDetails', { 
                    token: {
                      id: item.id,
                      symbol: item.symbol,
                      name: item.name,
                      image: item.image,
                      current_price: item.current_price,
                      price_change_percentage_24h: item.price_change_percentage_24h,
                      balance: '0', // No balance for trending tokens
                      decimals: 18,
                      usdValue: 0
                    }
                  });
                }}
              >
                {item.image ? (
                  <Image 
                    source={{ uri: item.image }} 
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                    onError={() => {
                      console.log('Failed to load image for trending token:', item.symbol);
                    }}
                  />
                ) : (
                  <View className="w-8 h-8 bg-gray-200 rounded-full mr-3" />
                )}
                <View className="flex-1">
                  <Text className="font-medium text-slate-900">{item.symbol?.toUpperCase()}</Text>
                  <Text className="text-sm text-slate-500">{item.name}</Text>
                  {item.current_price && (
                    <Text className="text-xs text-slate-400">
                      ${item.current_price.toFixed(2)}
                    </Text>
                  )}
                </View>
                {item.price_change_percentage_24h && (
                  <View className="items-end">
                    <Text className={`text-sm font-medium ${
                      item.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {`${item.price_change_percentage_24h > 0 ? '+' : ''}${item.price_change_percentage_24h.toFixed(2)}%`}
                    </Text>
                    <Ionicons 
                      name={item.price_change_percentage_24h > 0 ? 'trending-up' : 'trending-down'} 
                      size={12} 
                      color={item.price_change_percentage_24h > 0 ? '#16a34a' : '#dc2626'} 
                      style={{ marginTop: 2 }}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="p-8 items-center">
                {isLoadingTrending ? (
                  <Text className="text-slate-500 text-center">
                    Loading trending tokens...
                  </Text>
                ) : (
                  <Text className="text-slate-500 text-center">
                    No trending tokens available
                  </Text>
                )}
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};