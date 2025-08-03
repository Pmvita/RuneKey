import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { CoinDetailsCard } from '../components/coins/CoinDetailsCard';
import { Button } from '../components/common/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);

interface TokenDetailsScreenProps {
  route: {
    params: {
      token: any;
    };
  };
  navigation: any;
}

export const TokenDetailsScreen: React.FC<TokenDetailsScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { token } = route.params;
  const { getTokenDetails } = useDevWallet();
  const [coinInfo, setCoinInfo] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTokenData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { coinInfo: info, chartData: chart } = await getTokenDetails(token.coinId);
      
      setCoinInfo(info);
      setChartData(chart);
    } catch (err) {
      console.error('Failed to load token data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTokenData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTokenData();
  }, [token]);

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatUSDValue = (value: number) => {
    if (!value || isNaN(value)) return '$0.00';
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

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
          <StyledView className="flex-row items-center mb-4">
            <StyledTouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </StyledTouchableOpacity>
            <StyledText className="text-2xl font-bold text-ice-900 dark:text-ice-100">
              {token.symbol}
            </StyledText>
          </StyledView>
        </StyledView>

        {/* Token Info Card */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-6 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
            <StyledView className="flex-row items-center mb-4">
              <StyledView className="w-12 h-12 bg-white/80 dark:bg-gray-800/80 border border-frost-300 rounded-full items-center justify-center mr-4">
                <StyledText className="text-frost-700 dark:text-ice-300 font-bold text-sm">
                  {token.symbol.charAt(0)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="text-xl font-bold text-ice-900 dark:text-ice-100">
                  {token.name}
                </StyledText>
                <StyledText className="text-ice-600 dark:text-ice-400">
                  {token.symbol}
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView className="space-y-3">
              <StyledView className="flex-row justify-between items-center">
                <StyledText className="text-ice-600 dark:text-ice-400">
                  Your Balance
                </StyledText>
                <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
                  {formatBalance(token.balance, token.decimals)} {token.symbol}
                </StyledText>
              </StyledView>

              {token.usdValue && (
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-ice-600 dark:text-ice-400">
                    USD Value
                  </StyledText>
                  <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
                    {formatUSDValue(token.usdValue)}
                  </StyledText>
                </StyledView>
              )}

              {coinInfo?.current_price && (
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-ice-600 dark:text-ice-400">
                    Current Price
                  </StyledText>
                  <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
                    ${coinInfo.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </StyledText>
                </StyledView>
              )}

              {coinInfo?.price_change_percentage_24h && (
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-ice-600 dark:text-ice-400">
                    24h Change
                  </StyledText>
                  <StyledView 
                    className={`px-2 py-1 rounded ${
                      coinInfo.price_change_percentage_24h >= 0 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    <StyledText 
                      className={`text-sm font-medium ${
                        coinInfo.price_change_percentage_24h >= 0 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {coinInfo.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coinInfo.price_change_percentage_24h.toFixed(2)}%
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Market Data */}
        {coinInfo && (
          <StyledView className="px-6 mb-6">
            <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
              Market Data
            </StyledText>
            
            <StyledView className="space-y-3">
              {coinInfo.market_cap && (
                <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-lg border border-glass-frost dark:border-ice-700/30">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-ice-600 dark:text-ice-400">
                      Market Cap
                    </StyledText>
                    <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
                      ${(coinInfo.market_cap / 1e9).toFixed(2)}B
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.total_volume && (
                <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-lg border border-glass-frost dark:border-ice-700/30">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-ice-600 dark:text-ice-400">
                      24h Volume
                    </StyledText>
                    <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
                      ${(coinInfo.total_volume / 1e6).toFixed(2)}M
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.circulating_supply && (
                <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-lg border border-glass-frost dark:border-ice-700/30">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-ice-600 dark:text-ice-400">
                      Circulating Supply
                    </StyledText>
                    <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
                      {coinInfo.circulating_supply.toLocaleString()}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.market_cap_rank && (
                <StyledView className="p-4 bg-glass-white dark:bg-glass-dark rounded-lg border border-glass-frost dark:border-ice-700/30">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-ice-600 dark:text-ice-400">
                      Market Rank
                    </StyledText>
                    <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
                      #{coinInfo.market_cap_rank}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}
            </StyledView>
          </StyledView>
        )}

        {/* Chart */}
        <StyledView className="px-6 mb-6">
          <CoinDetailsCard
            coinInfo={coinInfo}
            chartData={chartData}
            isLoading={isLoading}
            error={error}
            onRefresh={loadTokenData}
            showChart={true}
          />
        </StyledView>

        {/* Actions */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
            Actions
          </StyledText>
          
          <StyledView className="space-y-3">
            <Button
              title="Send"
              onPress={() => {/* Navigate to send */}}
              variant="frost"
              fullWidth
            />
            
            <Button
              title="Swap"
              onPress={() => {/* Navigate to swap */}}
              variant="outline"
              fullWidth
            />
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 