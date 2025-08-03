import React from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, Image } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { CoinInfo } from '../../services/api/priceService';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface CoinDetailsCardProps {
  coinInfo: CoinInfo | null;
  chartData: any;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showChart?: boolean;
}

export const CoinDetailsCard: React.FC<CoinDetailsCardProps> = ({
  coinInfo,
  chartData,
  isLoading = false,
  error = null,
  onRefresh,
  showChart = true,
}) => {
  if (isLoading) {
    return (
      <StyledView className="p-6 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
        <StyledView className="items-center">
          <StyledText className="text-ice-600 dark:text-ice-400">
            Loading coin details...
          </StyledText>
        </StyledView>
      </StyledView>
    );
  }

  if (error) {
    return (
      <StyledView className="p-6 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
        <StyledView className="items-center">
          <StyledText className="text-red-600 dark:text-red-400 text-center">
            {error}
          </StyledText>
          {onRefresh && (
            <StyledTouchableOpacity
              className="mt-4 px-4 py-2 bg-frost-500 rounded-lg"
              onPress={onRefresh}
            >
              <StyledText className="text-white font-medium">
                Retry
              </StyledText>
            </StyledTouchableOpacity>
          )}
        </StyledView>
      </StyledView>
    );
  }

  if (!coinInfo) {
    return (
      <StyledView className="p-6 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
        <StyledView className="items-center">
          <StyledText className="text-ice-600 dark:text-ice-400">
            No coin data available
          </StyledText>
        </StyledView>
      </StyledView>
    );
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    })}`;
  };

  const formatPercentage = (change: number) => {
    const isPositive = change >= 0;
    return {
      value: change,
      formatted: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
      isPositive,
    };
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `$${(marketCap / 1e3).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e12) {
      return `$${(volume / 1e12).toFixed(2)}T`;
    } else if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const priceChange24h = formatPercentage(coinInfo.price_change_percentage_24h);
  const marketCapChange24h = formatPercentage(coinInfo.market_cap_change_percentage_24h);

  return (
    <StyledView className="p-6 bg-glass-white dark:bg-glass-dark rounded-xl border border-glass-frost dark:border-ice-700/30">
      {/* Header */}
      <StyledView className="flex-row items-center mb-6">
        <Image
          source={{ uri: coinInfo.image }}
          style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
        />
        <StyledView className="flex-1">
          <StyledText className="text-xl font-bold text-ice-900 dark:text-ice-100">
            {coinInfo.name}
          </StyledText>
          <StyledText className="text-lg text-ice-600 dark:text-ice-400">
            {coinInfo.symbol.toUpperCase()}
          </StyledText>
        </StyledView>
        <StyledView className="items-end">
          <StyledText className="text-2xl font-bold text-ice-900 dark:text-ice-100">
            {formatPrice(coinInfo.current_price)}
          </StyledText>
          <StyledView 
            className={`px-2 py-1 rounded ${
              priceChange24h.isPositive 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-red-100 dark:bg-red-900'
            }`}
          >
            <StyledText 
              className={`text-sm font-medium ${
                priceChange24h.isPositive 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {priceChange24h.formatted}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>

      {/* Chart */}
      {showChart && (
        <StyledView className="mb-6">
          <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
            Price Chart (30 Days)
          </StyledText>
          <StyledView className="h-48 bg-gray-100 rounded-lg items-center justify-center">
            <StyledText className="text-slate-500">
              Chart data unavailable
            </StyledText>
          </StyledView>
        </StyledView>
      )}

      {/* Market Stats */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
          Market Statistics
        </StyledText>
        
        <StyledView className="space-y-4">
          {/* Market Cap */}
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-row items-center">
              <Ionicons name="trending-up" size={20} color="#64748b" />
              <StyledText className="text-ice-600 dark:text-ice-400 ml-2">
                Market Cap
              </StyledText>
            </StyledView>
            <StyledView className="items-end">
              <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
                {formatMarketCap(coinInfo.market_cap)}
              </StyledText>
              <StyledView 
                className={`px-2 py-1 rounded ${
                  marketCapChange24h.isPositive 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
                }`}
              >
                <StyledText 
                  className={`text-xs font-medium ${
                    marketCapChange24h.isPositive 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {marketCapChange24h.formatted}
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>

          {/* Volume */}
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-row items-center">
              <Ionicons name="bar-chart" size={20} color="#64748b" />
              <StyledText className="text-ice-600 dark:text-ice-400 ml-2">
                24h Volume
              </StyledText>
            </StyledView>
            <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
              {formatVolume(coinInfo.total_volume)}
            </StyledText>
          </StyledView>

          {/* Rank */}
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-row items-center">
              <Ionicons name="trophy" size={20} color="#64748b" />
              <StyledText className="text-ice-600 dark:text-ice-400 ml-2">
                Market Rank
              </StyledText>
            </StyledView>
            <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
              #{coinInfo.market_cap_rank}
            </StyledText>
          </StyledView>

          {/* Supply */}
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-row items-center">
              <Ionicons name="wallet" size={20} color="#64748b" />
              <StyledText className="text-ice-600 dark:text-ice-400 ml-2">
                Circulating Supply
              </StyledText>
            </StyledView>
            <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
              {coinInfo.circulating_supply.toLocaleString()}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>

      {/* Price Range */}
      <StyledView>
        <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100 mb-4">
          24h Price Range
        </StyledText>
        
        <StyledView className="space-y-2">
          <StyledView className="flex-row justify-between items-center">
            <StyledText className="text-ice-600 dark:text-ice-400">
              High
            </StyledText>
            <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
              {formatPrice(coinInfo.high_24h)}
            </StyledText>
          </StyledView>
          
          <StyledView className="flex-row justify-between items-center">
            <StyledText className="text-ice-600 dark:text-ice-400">
              Low
            </StyledText>
            <StyledText className="text-ice-900 dark:text-ice-100 font-semibold">
              {formatPrice(coinInfo.low_24h)}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}; 