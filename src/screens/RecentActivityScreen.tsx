import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'swap';
  amount: string;
  token: string;
  toFrom: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
}

export const RecentActivityScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('RecentActivityScreen');
    }, [])
  );

  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'sent',
      amount: '0.5',
      token: 'ETH',
      toFrom: '0x742d...abcd',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
      hash: '0x123...789'
    },
    {
      id: '2',
      type: 'received',
      amount: '1000',
      token: 'USDC',
      toFrom: '0x456d...efgh',
      date: '2024-01-14T15:45:00Z',
      status: 'completed',
      hash: '0x456...012'
    },
    {
      id: '3',
      type: 'swap',
      amount: '0.1',
      token: 'ETH → USDC',
      toFrom: 'DEX Swap',
      date: '2024-01-13T09:15:00Z',
      status: 'completed',
      hash: '0x789...345'
    },
    {
      id: '4',
      type: 'sent',
      amount: '50',
      token: 'USDT',
      toFrom: '0x789d...ijkl',
      date: '2024-01-12T14:20:00Z',
      status: 'pending'
    }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type: string, status: string) => {
    const color = status === 'completed' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#ef4444';
    
    switch (type) {
      case 'sent':
        return <Ionicons name="arrow-up" size={20} color={color} />;
      case 'received':
        return <Ionicons name="arrow-down" size={20} color={color} />;
      case 'swap':
        return <Ionicons name="swap-horizontal" size={20} color={color} />;
      default:
        return <Ionicons name="help" size={20} color={color} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
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
      
      <StyledScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <StyledView className="p-6">
          <StyledText className="text-2xl font-bold text-ice-900 dark:text-ice-100 mb-2">
            Recent Activity
          </StyledText>
          <StyledText className="text-ice-600 dark:text-ice-400">
            Your transaction history
          </StyledText>
        </StyledView>

        {/* Activity List */}
        <StyledView className="px-6">
          {transactions.length > 0 ? (
            <Card variant="frost" className="overflow-hidden">
              {transactions.map((transaction, index) => (
                <StyledView
                  key={transaction.id}
                  className={`p-4 flex-row items-center ${
                    index !== transactions.length - 1 ? 'border-b border-ice-200 dark:border-ice-700' : ''
                  }`}
                >
                  {/* Transaction Icon */}
                                        <StyledView className="w-12 h-12 bg-ice-200 dark:bg-ice-800 rounded-full items-center justify-center mr-4">
                    {getTransactionIcon(transaction.type, transaction.status)}
                  </StyledView>

                  {/* Transaction Details */}
                  <StyledView className="flex-1">
                    <StyledView className="flex-row items-center justify-between mb-1">
                      <StyledText className="text-base font-semibold text-ice-900 dark:text-ice-100">
                        {transaction.type === 'sent' && 'Sent'}
                        {transaction.type === 'received' && 'Received'}
                        {transaction.type === 'swap' && 'Swapped'}
                      </StyledText>
                      <StyledText className="text-base font-semibold text-ice-900 dark:text-ice-100">
                        {transaction.type === 'sent' && '-'}
                        {transaction.type === 'received' && '+'}
                        {transaction.amount} {transaction.token}
                      </StyledText>
                    </StyledView>
                    
                    <StyledView className="flex-row items-center justify-between">
                      <StyledText className="text-sm text-ice-600 dark:text-ice-400">
                        {transaction.type === 'swap' ? transaction.toFrom : `To: ${transaction.toFrom}`}
                      </StyledText>
                      <StyledText className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </StyledText>
                    </StyledView>
                    
                    <StyledText className="text-xs text-ice-500 dark:text-ice-500 mt-1">
                      {formatDate(transaction.date)}
                    </StyledText>
                  </StyledView>
                </StyledView>
              ))}
            </Card>
          ) : (
            <Card variant="frost" className="p-8">
              <StyledView className="items-center">
                <Ionicons name="time-outline" size={48} color="#64748b" />
                <StyledText className="text-lg font-semibold text-ice-700 dark:text-ice-300 mt-4 mb-2">
                  No Recent Activity
                </StyledText>
                <StyledText className="text-ice-600 dark:text-ice-400 text-center">
                  Your transaction history will appear here once you start using your wallet.
                </StyledText>
              </StyledView>
            </Card>
          )}
        </StyledView>

        {/* Additional Space */}
        <StyledView className="h-6" />
      </StyledScrollView>
    </SafeAreaView>
  );
};