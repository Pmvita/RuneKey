import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCoinData } from '../hooks/token/useCoinData';
import { CoinDetailsCard } from '../components/coins/CoinDetailsCard';
import { Button } from '../components/common/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);

export const CoinDetailsScreen: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    coinInfo,
    chartData,
    isLoading,
    error,
    fetchCoinInfo,
    fetchChartData,
    clearData,
  } = useCoinData();

  const loadCoinData = async () => {
    await Promise.all([
      fetchCoinInfo(selectedCoin),
      fetchChartData(selectedCoin, 30),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoinData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCoinData();
  }, [selectedCoin]);

  const popularCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  ];

  return (
    <StyledSafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
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
            Coin Details
          </StyledText>
          <StyledText className="text-ice-600 dark:text-ice-400">
            Real-time cryptocurrency data and charts
          </StyledText>
        </StyledView>

        {/* Coin Selector */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
            Select Coin
          </StyledText>
          <StyledView className="flex-row flex-wrap gap-2">
            {popularCoins.map((coin) => (
              <Button
                key={coin.id}
                title={coin.symbol}
                onPress={() => setSelectedCoin(coin.id)}
                variant={selectedCoin === coin.id ? 'frost' : 'secondary'}
                size="sm"
              />
            ))}
          </StyledView>
        </StyledView>

        {/* Coin Details */}
        <StyledView className="px-6 mb-6">
          <CoinDetailsCard
            coinInfo={coinInfo}
            chartData={chartData}
            isLoading={isLoading}
            error={error}
            onRefresh={loadCoinData}
            showChart={true}
          />
        </StyledView>

        {/* API Info */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
            <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-2">
              About the API
            </StyledText>
            <StyledText className="text-ice-600 dark:text-ice-400 mb-2">
              This demo uses the CoinGecko API, which is completely free and doesn't require an API key for basic usage.
            </StyledText>
            <StyledText className="text-ice-600 dark:text-ice-400 mb-2">
              Features included:
            </StyledText>
            <StyledView className="ml-4 space-y-1">
              <StyledText className="text-ice-600 dark:text-ice-400">
                • Real-time price data
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                • 30-day price charts
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                • Market cap and volume
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                • 24h price changes
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                • Circulating supply info
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Usage Instructions */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
            <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-2">
              How to Use
            </StyledText>
            <StyledText className="text-ice-600 dark:text-ice-400 mb-2">
              To integrate this into your app:
            </StyledText>
            <StyledView className="ml-4 space-y-1">
              <StyledText className="text-ice-600 dark:text-ice-400">
                1. Import the useCoinData hook
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                2. Use fetchCoinInfo() for detailed data
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                3. Use fetchChartData() for price charts
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                4. Use fetchTopCoins() for market listings
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400">
                5. Use searchCoins() for coin search
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 