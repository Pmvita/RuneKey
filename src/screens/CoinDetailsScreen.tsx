import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCoinData } from '../hooks/token/useCoinData';
import { CoinDetailsCard } from '../components/coins/CoinDetailsCard';
import { Button } from '../components/common/Button';

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
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
      {/* Icy blue background overlay */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="p-6">
          <Text className="text-2xl font-bold text-ice-900 dark:text-ice-100 mb-2">
            Coin Details
          </Text>
          <Text className="text-ice-600 dark:text-ice-400">
            Real-time cryptocurrency data and charts
          </Text>
        </View>

        {/* Coin Selector */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
            Select Coin
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {popularCoins.map((coin) => (
              <Button
                key={coin.id}
                title={coin.symbol}
                onPress={() => setSelectedCoin(coin.id)}
                variant={selectedCoin === coin.id ? 'frost' : 'secondary'}
                size="sm"
              />
            ))}
          </View>
        </View>

        {/* Coin Details */}
        <View className="px-6 mb-6">
          <CoinDetailsCard
            coinInfo={coinInfo}
            chartData={chartData}
            isLoading={isLoading}
            error={error}
            onRefresh={loadCoinData}
            showChart={true}
          />
        </View>

        {/* API Info */}
        <View className="px-6 mb-6">
          <View className="p-4 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
            <Text className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-2">
              About the API
            </Text>
            <Text className="text-ice-600 dark:text-ice-400 mb-2">
              This demo uses the CoinGecko API, which is completely free and doesn't require an API key for basic usage.
            </Text>
            <Text className="text-ice-600 dark:text-ice-400 mb-2">
              Features included:
            </Text>
            <View className="ml-4 space-y-1">
              <Text className="text-ice-600 dark:text-ice-400">
                • Real-time price data
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                • 30-day price charts
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                • Market cap and volume
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                • 24h price changes
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                • Circulating supply info
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Instructions */}
        <View className="px-6 mb-6">
          <View className="p-4 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
            <Text className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-2">
              How to Use
            </Text>
            <Text className="text-ice-600 dark:text-ice-400 mb-2">
              To integrate this into your app:
            </Text>
            <View className="ml-4 space-y-1">
              <Text className="text-ice-600 dark:text-ice-400">
                1. Import the useCoinData hook
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                2. Use fetchCoinInfo() for detailed data
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                3. Use fetchChartData() for price charts
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                4. Use fetchTopCoins() for market listings
              </Text>
              <Text className="text-ice-600 dark:text-ice-400">
                5. Use searchCoins() for coin search
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};