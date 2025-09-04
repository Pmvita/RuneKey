import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
} from '../components';
import { useWallet } from '../hooks/wallet/useWallet';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { useNavigation } from '@react-navigation/native';

import { logger } from '../utils/logger';

export const HomeScreen: React.FC = () => {
  const { isConnected, currentWallet, activeNetwork } = useWallet();
  const { connectDevWallet } = useDevWallet();
  const { 
    fetchPrices, 
    startPriceRefresh, 
    stopPriceRefresh, 
    isLoading: isLoadingPrices,
    getTokenPrice,
    getTokenPriceChange,
    calculateUSDValue
  } = usePrices();
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const navigation = useNavigation<any>();

  // Load mock data for development
  const loadWalletData = async () => {
    setLoadingData(true);
    try {
      // Import the mock data directly
      const mockData = require('../../mockData/api/dev-wallet.json');
      console.log('📊 HomeScreen: Loading Dev Mode Wallet mockData...');
      setWalletData(mockData.wallet);
      logger.logButtonPress('HomeScreen', 'load mock wallet data');
    } catch (error) {
      logger.logError('HomeScreen', 'Failed to load wallet data');
      console.error('Failed to load wallet data:', error);
      // Set fallback data for development
      setWalletData({
        totalValue: 15500000,
        tokens: [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '1250.875',
            usdValue: 3316250.94,
            priceChange24h: 1.94,
            logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
          },
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: '35.5',
            usdValue: 1535379.26,
            priceChange24h: 2.98,
            logoURI: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
          }
        ]
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  // Start live price updates when wallet data is loaded
  useEffect(() => {
    if (walletData && walletData.tokens) {
      // Get addresses for live price fetching
      const tokenAddresses = walletData.tokens
        .map((token: any) => token.address)
        .filter(Boolean);
      
      if (tokenAddresses.length > 0) {
        // Fetch live prices for all tokens
        fetchPrices(tokenAddresses);
        
        // Set up interval for price updates (respecting API rate limits)
        const interval = setInterval(() => {
          fetchPrices(tokenAddresses);
        }, 60000); // Update every 60 seconds to respect API limits
        
        return () => {
          clearInterval(interval);
          stopPriceRefresh();
        };
      }
    }
  }, [walletData, fetchPrices, stopPriceRefresh]);

  // Log screen focus
  useFocusEffect(
    useCallback(() => {
      logger.logScreenFocus('HomeScreen');
    }, [])
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <Text className="text-red-500">📤</Text>;
      case 'receive':
        return <Text className="text-green-500">📥</Text>;
      case 'swap':
        return <Text className="text-blue-500">🔄</Text>;
      default:
        return <Text className="text-gray-500">📄</Text>;
    }
  };

  const calculateTotalValue = () => {
    if (!walletData || !walletData.tokens) return 0;
    return walletData.tokens.reduce((total: number, token: any) => {
      const liveUSDValue = calculateUSDValue(token.address, token.balance);
      return total + (liveUSDValue || token.usdValue || 0);
    }, 0);
  };

  const onRefresh = async () => {
    await loadWalletData();
  };



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Particle Effects */}
      <ParticleEffect 
        type="confetti" 
        active={showParticles} 
        onComplete={() => setShowParticles(false)}
      />
      
      {/* Light background overlay */}
      <View 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(93,138,168)',
        }}
      />

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loadingData} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">
            RuneKey
          </Text>
          
          {/* Total Portfolio Value */}
          {walletData ? (
            <LiquidGlass
              cornerRadius={20}
              elasticity={0.2}
              blurAmount={1.0}
              onPress={() => {
                console.log('🎯 ANIMATION: Portfolio card pressed - liquid glass effect');
                logger.logButtonPress('Portfolio', 'portfolio card interaction');
              }}
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm text-slate-600 mt-1 px-4">
                  Total Portfolio Value
                </Text>
                <View className="flex-row items-center">
                  <AnimatedPriceChange 
                    value={((calculateTotalValue() - 15000000) / 15000000 * 100)}
                    className="mr-1"
                  />
                </View>
              </View>
              <View className="px-3 pb-10">
                <AnimatedNumber
                  value={calculateTotalValue()}
                  format="currency"
                  className="text-3xl font-bold text-black"
                  duration={1500}
                />
              </View>
            </LiquidGlass>
          ) : (
            <PortfolioSkeleton />
          )}
        </View>

        {/* Spacing */}
        <View className="h-4" />



        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </Text>
          <LiquidGlass
            cornerRadius={20}
            elasticity={0.15}
            blurAmount={0.8}
          >
            <View className="flex-row justify-around items-center p-5">
              <View className="items-center">
                <LiquidGlass
                  className="w-16 h-16 bg-red-50/50 border border-red-200/50 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => {
                    console.log('🎯 ANIMATION: Send button pressed - liquid glass effect');
                    logger.logButtonPress('Send', 'navigate to send screen');
                    setShowParticles(true);
                    setTimeout(() => {
                      console.log('🎯 ANIMATION: Particle effect completed for Send button');
                      setShowParticles(false);
                    }, 2000);
                    // Navigate to Send screen
                    navigation.navigate('Send' as never);
                  }}
                >
                  <Ionicons name="arrow-up" size={24} color="#ef4444" />
                </LiquidGlass>
                <Text className="text-slate-600 text-sm mt-3 font-medium">Send</Text>
              </View>

              <View className="items-center">
                <LiquidGlass
                  className="w-16 h-16 bg-green-50/50 border border-green-200/50 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => {
                    console.log('🎯 ANIMATION: Receive button pressed - liquid glass effect');
                    logger.logButtonPress('Receive', 'navigate to receive screen');
                    setShowParticles(true);
                    setTimeout(() => {
                      console.log('🎯 ANIMATION: Particle effect completed for Receive button');
                      setShowParticles(false);
                    }, 2000);
                  }}
                >
                  <Ionicons name="arrow-down" size={24} color="#22c55e" />
                </LiquidGlass>
                <Text className="text-slate-600 text-sm mt-3 font-medium">Receive</Text>
              </View>

              <View className="items-center">
                <LiquidGlass
                  className="w-16 h-16 bg-blue-50/50 border border-blue-200/50 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => {
                    console.log('🎯 ANIMATION: Swap button pressed - liquid glass effect');
                    logger.logButtonPress('Swap', 'navigate to swap screen');
                    setShowParticles(true);
                    setTimeout(() => {
                      console.log('🎯 ANIMATION: Particle effect completed for Swap button');
                      setShowParticles(false);
                    }, 2000);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </LiquidGlass>
                <Text className="text-slate-600 text-sm mt-3 font-medium">Swap</Text>
              </View>

              <View className="items-center">
                <LiquidGlass
                  className="w-16 h-16 bg-yellow-50/50 border border-yellow-200/50 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => {
                    console.log('🎯 ANIMATION: Buy button pressed - triggering particle effect');
                    logger.logButtonPress('Buy', 'navigate to buy screen');
                    setShowParticles(true);
                    setTimeout(() => {
                      console.log('🎯 ANIMATION: Particle effect completed for Buy button');
                      setShowParticles(false);
                    }, 2000);
                  }}
                >
                  <Ionicons name="card" size={24} color="#eab308" />
                </LiquidGlass>
                <Text className="text-slate-600 text-sm mt-3 font-medium">Buy</Text>
              </View>
            </View>
          </LiquidGlass>
        </View>

        {/* Assets Section */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">
            Assets
          </Text>
          
          {/* Loading Indicator */}
          {loadingData && (
            <View className="mb-4">
              {[1, 2, 3].map((index) => (
                <TokenSkeleton key={index} />
              ))}
            </View>
          )}

          {/* Live Price Indicator */}
          {isLoadingPrices && !loadingData && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <Text className="text-green-700 text-center font-medium">
                🔄 Updating live prices...
              </Text>
            </View>
          )}
          
          <LiquidGlass
            className="overflow-hidden"
            cornerRadius={20}
            elasticity={0.1}
            blurAmount={0.6}
          >
            {/* Tokens with Live Price Data - Sorted by Value */}
            {walletData && walletData.tokens && walletData.tokens
              .map((token: any, index: number) => {
                // Get live price data
                const livePrice = getTokenPrice(token.address);
                const livePriceChange = getTokenPriceChange(token.address);
                const liveUSDValue = calculateUSDValue(token.address, token.balance);
                
                return {
                  ...token,
                  liveUSDValue: liveUSDValue || token.usdValue,
                  livePrice: livePrice || token.currentPrice,
                  livePriceChange: livePriceChange || token.priceChange24h
                };
              })
              .sort((a: any, b: any) => (b.liveUSDValue || 0) - (a.liveUSDValue || 0))
              .map((token: any, index: number) => (
                <TokenListItem
                  key={token.address}
                  token={{
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                    balance: token.balance,
                    usdValue: token.liveUSDValue,
                    priceChange24h: token.livePriceChange,
                    logoURI: token.logoURI,
                    coinId: token.coinId,
                    currentPrice: token.livePrice
                  }}
                  onPress={() => {
                    logger.logButtonPress(`${token.symbol} Token`, 'view token details');
                    navigation.navigate('TokenDetails', { 
                      token: {
                        id: token.coinId || token.symbol?.toLowerCase() || 'bitcoin',
                        symbol: token.symbol || 'BTC',
                        name: token.name,
                        image: token.logoURI,
                        current_price: token.livePrice || token.currentPrice,
                        price_change_percentage_24h: token.livePriceChange || token.priceChange24h,
                        balance: token.balance,
                        decimals: token.decimals,
                        usdValue: token.liveUSDValue || token.usdValue,
                        address: token.address
                      }
                    });
                  }}
                  showPrice={true}
                  showPriceChange={true}
                />
              ))}
            
            {/* Fallback for no tokens */}
            {(!walletData || !walletData.tokens || walletData.tokens.length === 0) && (
              <View className="p-8 items-center">
                <Text className="text-slate-600 text-center">
                  No tokens found. Add some funds to get started!
                </Text>
              </View>
            )}
          </LiquidGlass>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};