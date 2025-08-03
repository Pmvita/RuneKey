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
            symbol: 'WBTC',
            name: 'Wrapped Bitcoin',
            balance: '35.5',
            usdValue: 1535379.26,
            priceChange24h: 2.98,
            logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png'
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
      return total + (token.usdValue || 0);
    }, 0);
  };

  const onRefresh = async () => {
    await loadWalletData();
  };



  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f8fafc' }}>
      {/* Light background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(248, 250, 252, 0.98)',
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
          <StyledText className="text-2xl font-bold text-slate-900 mb-2">
            RuneKey
          </StyledText>
          <StyledText className="text-slate-600 mb-4">
            Manage your digital assets
          </StyledText>
          
          {/* Total Portfolio Value */}
          {walletData && (
            <Card variant="frost" className="p-6 bg-white/90 border border-gray-300 shadow-lg backdrop-blur-sm">
              <StyledText className="text-sm text-slate-600 mb-1">
                Total Portfolio Value
              </StyledText>
              <StyledText className="text-3xl font-bold text-slate-900">
                {formatUSD(walletData.totalValue)}
              </StyledText>
            </Card>
          )}
        </StyledView>

        {/* Spacing */}
        <StyledView className="h-4" />

        {/* Quick Actions */}
        <StyledView className="px-6 mb-6">
          <Card variant="frost" className="p-6 bg-white/90 border border-gray-300 shadow-lg backdrop-blur-sm">
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
                <StyledText className="text-slate-700 text-sm mt-2 font-medium">Send</StyledText>
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
                <StyledText className="text-slate-700 text-sm mt-2 font-medium">Receive</StyledText>
              </StyledView>

              <StyledView className="items-center">
                <StyledTouchableOpacity
                  className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full items-center justify-center shadow-sm"
                  onPress={() => {
                    logger.logButtonPress('Swap', 'navigate to swap screen');
                    /* Navigate to swap */
                  }}
                >
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </StyledTouchableOpacity>
                <StyledText className="text-slate-700 text-sm mt-2 font-medium">Swap</StyledText>
              </StyledView>
            </StyledView>
          </Card>
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
          
          <Card variant="frost" className="overflow-hidden bg-white/90 border border-gray-300 shadow-lg backdrop-blur-sm">
            {/* Mock Data Tokens */}
            {walletData && walletData.tokens && walletData.tokens.map((token: any, index: number) => (
              <TokenListItem
                key={token.address}
                token={{
                  address: token.address,
                  symbol: token.symbol,
                  name: token.name,
                  decimals: token.decimals,
                  balance: token.balance,
                  usdValue: token.usdValue,
                  priceChange24h: token.priceChange24h,
                  logoURI: token.logoURI,
                  coinId: token.coinId
                }}
                onPress={() => {
                  logger.logButtonPress(`${token.symbol} Token`, 'view token details');
                  Alert.alert('Token Details', `${token.name} (${token.symbol})`);
                }}
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
          </Card>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};