import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tokens' | 'dapps' | 'collections'>('all');

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SearchScreen');
    }, [])
  );

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

  const trendingTokens = searchResults.filter(item => item.trending && item.type === 'token');
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
        return 'text-blue-600 dark:text-blue-400';
      case 'dapp':
        return 'text-purple-600 dark:text-purple-400';
      case 'collection':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6">
          <StyledText className="text-2xl font-bold text-ice-900 dark:text-ice-100 mb-4">
            Search
          </StyledText>
          
          {/* Search Input */}
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tokens, DApps, NFTs..."
            icon="search-outline"
          />
        </StyledView>

        {/* Categories */}
        <StyledView className="px-6 mb-6">
          <StyledScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StyledView className="flex-row space-x-3">
              {categories.map((category) => (
                <StyledTouchableOpacity
                  key={category.id}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    selectedCategory === category.id
                      ? 'bg-frost-500 border-frost-500'
                      : 'bg-white/80 dark:bg-gray-800/80 border-ice-300 dark:border-ice-700'
                  }`}
                  onPress={() => setSelectedCategory(category.id as any)}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={selectedCategory === category.id ? '#ffffff' : '#64748b'} 
                  />
                  <StyledText 
                    className={`ml-2 font-medium ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'text-ice-700 dark:text-ice-300'
                    }`}
                  >
                    {category.label}
                  </StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledView>
          </StyledScrollView>
        </StyledView>

        {/* Search Results or Default Content */}
        <StyledView className="px-6">
          {searchQuery ? (
            // Search Results
            <>
              <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
                Results for "{searchQuery}"
              </StyledText>
              {filteredResults.length > 0 ? (
                <Card variant="frost" className="overflow-hidden">
                  {filteredResults.map((item, index) => (
                    <StyledTouchableOpacity
                      key={item.id}
                      className={`p-4 flex-row items-center ${
                        index !== filteredResults.length - 1 ? 'border-b border-ice-200 dark:border-ice-700' : ''
                      }`}
                    >
                      <StyledView className="w-12 h-12 bg-ice-200 dark:bg-ice-800 rounded-full items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={24} color="#0ea5e9" />
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledView className="flex-row items-center">
                          <StyledText className="text-base font-semibold text-ice-900 dark:text-ice-100">
                            {item.name}
                          </StyledText>
                          {item.symbol && (
                            <StyledText className="text-sm text-ice-600 dark:text-ice-400 ml-2">
                              {item.symbol}
                            </StyledText>
                          )}
                          {item.trending && (
                            <StyledView className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded">
                              <StyledText className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                Trending
                              </StyledText>
                            </StyledView>
                          )}
                        </StyledView>
                        <StyledText className="text-sm text-ice-600 dark:text-ice-400 mt-1">
                          {item.description}
                        </StyledText>
                        <StyledText className={`text-xs font-medium mt-1 ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </StyledText>
                      </StyledView>
                    </StyledTouchableOpacity>
                  ))}
                </Card>
              ) : (
                <Card variant="frost" className="p-8">
                  <StyledView className="items-center">
                    <Ionicons name="search-outline" size={48} color="#64748b" />
                    <StyledText className="text-lg font-semibold text-ice-700 dark:text-ice-300 mt-4 mb-2">
                      No Results Found
                    </StyledText>
                    <StyledText className="text-ice-600 dark:text-ice-400 text-center">
                      Try adjusting your search terms or browse categories below.
                    </StyledText>
                  </StyledView>
                </Card>
              )}
            </>
          ) : (
            // Default Content
            <>
              {/* Trending Tokens */}
              <StyledView className="mb-6">
                <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
                  Trending Tokens
                </StyledText>
                <Card variant="frost" className="overflow-hidden">
                  {trendingTokens.map((token, index) => (
                    <StyledTouchableOpacity
                      key={token.id}
                      className={`p-4 flex-row items-center ${
                        index !== trendingTokens.length - 1 ? 'border-b border-ice-200 dark:border-ice-700' : ''
                      }`}
                    >
                      <StyledView className="w-10 h-10 bg-ice-200 dark:bg-ice-800 rounded-full items-center justify-center mr-3">
                        <Ionicons name={token.icon as any} size={20} color="#0ea5e9" />
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledView className="flex-row items-center justify-between">
                          <StyledText className="text-base font-semibold text-ice-900 dark:text-ice-100">
                            {token.name}
                          </StyledText>
                          <StyledText className="text-sm text-ice-600 dark:text-ice-400">
                            {token.symbol}
                          </StyledText>
                        </StyledView>
                      </StyledView>
                    </StyledTouchableOpacity>
                  ))}
                </Card>
              </StyledView>

              {/* Browse Categories */}
              <StyledView>
                <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
                  Browse by Category
                </StyledText>
                <Card variant="frost" className="overflow-hidden">
                  {categoryResults.slice(0, 5).map((item, index) => (
                    <StyledTouchableOpacity
                      key={item.id}
                      className={`p-4 flex-row items-center ${
                        index !== Math.min(categoryResults.length, 5) - 1 ? 'border-b border-ice-200 dark:border-ice-700' : ''
                      }`}
                    >
                      <StyledView className="w-12 h-12 bg-ice-200 dark:bg-ice-800 rounded-full items-center justify-center mr-4">
                        <Ionicons name={item.icon as any} size={24} color="#0ea5e9" />
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledView className="flex-row items-center">
                          <StyledText className="text-base font-semibold text-ice-900 dark:text-ice-100">
                            {item.name}
                          </StyledText>
                          {item.symbol && (
                            <StyledText className="text-sm text-ice-600 dark:text-ice-400 ml-2">
                              {item.symbol}
                            </StyledText>
                          )}
                        </StyledView>
                        <StyledText className="text-sm text-ice-600 dark:text-ice-400 mt-1">
                          {item.description}
                        </StyledText>
                        <StyledText className={`text-xs font-medium mt-1 ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </StyledText>
                      </StyledView>
                    </StyledTouchableOpacity>
                  ))}
                </Card>
              </StyledView>
            </>
          )}
        </StyledView>

        {/* Additional Space */}
        <StyledView className="h-6" />
      </StyledScrollView>
    </SafeAreaView>
  );
};