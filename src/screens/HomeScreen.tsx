import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { TokenListItem } from '../components/token/TokenListItem';
import { useWallet } from '../hooks/wallet/useWallet';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';

import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);
const StyledTouchableOpacity = styled(TouchableOpacity);

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

  // Load mock data for development
  const loadWalletData = async () => {
    setLoadingData(true);
    try {
      // Import the mock data directly
      const mockData = require('../../mockData/api/dev-wallet.json');
      console.log('📊 HomeScreen: Loading mock data...', mockData.wallet);
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
        
        // Set up interval for price updates
        const interval = setInterval(() => {
          fetchPrices(tokenAddresses);
        }, 30000); // Update every 30 seconds
        
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
        return <StyledText className="text-red-500">📤</StyledText>;
      case 'receive':
        return <StyledText className="text-green-500">📥</StyledText>;
      case 'swap':
        return <StyledText className="text-blue-500">🔄</StyledText>;
      default:
        return <StyledText className="text-gray-500">📄</StyledText>;
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
      {/* Light background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(93,138,168)',
        }}
      />

      <StyledScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loadingData} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <StyledView className="px-6 pt-6 pb-4">
          <StyledText className="text-2xl font-bold text-slate-900 mb-2 text-center">
            RuneKey
          </StyledText>
          
          {/* Total Portfolio Value */}
          {walletData && (
            <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row justify-between items-center mb-2">
                <StyledText className="text-sm text-slate-600">
                  Total Portfolio Value
                </StyledText>
                <StyledView className="flex-row items-center">
                  <StyledText className={`text-sm font-medium ${calculateTotalValue() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateTotalValue() > 0 ? '+' : ''}{((calculateTotalValue() - 15000000) / 15000000 * 100).toFixed(2)}%
                  </StyledText>
                  <StyledText className={`ml-1 ${calculateTotalValue() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateTotalValue() > 0 ? '↗' : '↘'}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledText className="text-3xl font-bold text-black">
                {formatUSD(calculateTotalValue())}
              </StyledText>
            </StyledView>
          )}
        </StyledView>

        {/* Spacing */}
        <StyledView className="h-4" />

        {/* Quick Actions */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <StyledView className="flex-row justify-around">
              <StyledView className="items-center">
                <StyledTouchableOpacity
                  className="w-16 h-16 bg-red-50 border border-red-200 rounded-full items-center justify-center shadow-sm"
                  onPress={() => {
                    logger.logButtonPress('Send', 'navigate to send screen');
                    /* Navigate to send */
                  }}
                >
                  <Ionicons name="arrow-up" size={24} color="#ef4444" />
                </StyledTouchableOpacity>
                <StyledText className="text-slate-600 text-sm mt-2 font-medium">Send</StyledText>
              </StyledView>

              <StyledView className="items-center">
                <StyledTouchableOpacity
                  className="w-16 h-16 bg-green-50 border border-green-200 rounded-full items-center justify-center shadow-sm"
                  onPress={() => {
                    logger.logButtonPress('Receive', 'navigate to receive screen');
                    /* Navigate to receive */
                  }}
                >
                  <Ionicons name="arrow-down" size={24} color="#22c55e" />
                </StyledTouchableOpacity>
                <StyledText className="text-slate-600 text-sm mt-2 font-medium">Receive</StyledText>
              </StyledView>

              <StyledView className="items-center">
                <StyledTouchableOpacity
                  className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full items-center justify-center shadow-sm"
                  onPress={() => {
                    logger.logButtonPress('Swap', 'navigate to receive screen');
                    /* Navigate to swap */
                  }}
                >
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </StyledTouchableOpacity>
                <StyledText className="text-slate-600 text-sm mt-2 font-medium">Swap</StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Assets Section */}
        <StyledView className="px-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Assets
          </StyledText>
          
          {/* Loading Indicator */}
          {loadingData && (
            <StyledView className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <StyledText className="text-blue-700 text-center font-medium">
                Loading assets...
              </StyledText>
            </StyledView>
          )}

          {/* Live Price Indicator */}
          {isLoadingPrices && !loadingData && (
            <StyledView className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <StyledText className="text-green-700 text-center font-medium">
                🔄 Updating live prices...
              </StyledText>
            </StyledView>
          )}
          
          <StyledView className="overflow-hidden border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
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
                    Alert.alert('Token Details', `${token.name} (${token.symbol})`);
                  }}
                  showPrice={true}
                  showPriceChange={true}
                />
              ))}
            
            {/* Fallback for no tokens */}
            {(!walletData || !walletData.tokens || walletData.tokens.length === 0) && (
              <StyledView className="p-8 items-center">
                <StyledText className="text-slate-600 text-center">
                  No tokens found. Add some funds to get started!
                </StyledText>
              </StyledView>
            )}
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};