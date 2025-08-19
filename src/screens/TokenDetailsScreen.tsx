import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { priceService, CoinInfo, ChartData } from '../services/api/priceService';
import { useWallet } from '../hooks/wallet/useWallet';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { logger } from '../utils/logger';
import { LiquidGlass } from '../components';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);

const { width: screenWidth } = Dimensions.get('window');

type TokenDetailsRouteProp = RouteProp<RootStackParamList, 'TokenDetails'>;

export const TokenDetailsScreen: React.FC = () => {
  const route = useRoute<TokenDetailsRouteProp>();
  const navigation = useNavigation();
  const { token } = route.params;
  const { currentWallet } = useWallet();
  const { transactions } = useWalletStore();
  
  // Validate token object
  if (!token || !token.symbol) {
    return (
      <StyledSafeAreaView className="flex-1" style={{ backgroundColor: '#f8fafc' }}>
        <StyledView className="flex-1 items-center justify-center p-6">
          <StyledText className="text-lg text-slate-600 text-center">
            Invalid token data. Please try again.
          </StyledText>
        </StyledView>
      </StyledSafeAreaView>
    );
  }
  
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '7d' | '30d'>('30d');

  const loadTokenData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Map symbol to CoinGecko coin ID
      const getCoinGeckoId = (symbol: string): string => {
        const symbolMap: Record<string, string> = {
          'btc': 'bitcoin',
          'eth': 'ethereum',
          'usdc': 'usd-coin',
          'usdt': 'tether',
          'bnb': 'binancecoin',
        };
        return symbolMap[symbol.toLowerCase()] || 'bitcoin';
      };

      const coinGeckoId = getCoinGeckoId(token.symbol || 'btc');

      // Fetch comprehensive token data
      const [coinInfoResult, chartDataResult] = await Promise.all([
        priceService.fetchCoinInfo(coinGeckoId),
        priceService.fetchChartData(coinGeckoId, 30)
      ]);

      if (coinInfoResult.success && coinInfoResult.data) {
        // Validate that the coinInfo has required fields
        const validatedCoinInfo = coinInfoResult.data;
        if (validatedCoinInfo.id && validatedCoinInfo.symbol && validatedCoinInfo.name) {
          setCoinInfo(validatedCoinInfo);
        } else {
          console.log('Invalid coin info received:', validatedCoinInfo);
          setError('Invalid coin data received');
        }
      }

      if (chartDataResult.success && chartDataResult.data) {
        setChartData(chartDataResult.data);
      }
    } catch (err) {
      console.log('Failed to load token data:', err);
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

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? 'trending-up' : 'trending-down';
  };

  const calculatePortfolioAllocation = () => {
    if (!currentWallet || !coinInfo) return 0;
    
    const totalPortfolioValue = currentWallet.tokens.reduce((total, token) => {
      return total + (token.usdValue || 0);
    }, 0);
    
    const tokenValue = parseFloat(token.balance || '0') * (coinInfo.current_price || 0);
    return totalPortfolioValue > 0 ? (tokenValue / totalPortfolioValue) * 100 : 0;
  };

  const renderChart = () => {
    if (!chartData || !chartData.prices || !Array.isArray(chartData.prices) || chartData.prices.length === 0) {
      return (
        <StyledView className="h-48 bg-gray-100 rounded-lg items-center justify-center">
          <StyledText className="text-slate-500">Chart data unavailable</StyledText>
        </StyledView>
      );
    }

    // Simple fallback chart implementation
    const prices = chartData.prices
      .map(([timestamp, price]) => price)
      .filter(price => price !== null && price !== undefined && !isNaN(price) && isFinite(price) && price > 0);

    if (prices.length === 0) {
      return (
        <StyledView className="h-48 bg-gray-100 rounded-lg items-center justify-center">
          <StyledText className="text-slate-500">No valid price data</StyledText>
        </StyledView>
      );
    }

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange <= 0) {
      return (
        <StyledView className="h-48 bg-gray-100 rounded-lg items-center justify-center">
          <StyledText className="text-slate-500">No price variation</StyledText>
        </StyledView>
      );
    }

    return (
      <StyledView className="bg-white rounded-lg p-4 border border-gray-200">
        <StyledView className="flex-row justify-between items-center mb-4">
          <StyledText className="text-lg font-semibold text-slate-900">Price Chart</StyledText>
          <StyledView className="flex-row space-x-2">
            {(['1d', '7d', '30d'] as const).map((timeframe) => (
              <StyledTouchableOpacity
                key={timeframe}
                onPress={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded ${
                  selectedTimeframe === timeframe 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`}
              >
                <StyledText className={`text-sm font-medium ${
                  selectedTimeframe === timeframe 
                    ? 'text-white' 
                    : 'text-slate-600'
                }`}>
                  {timeframe.toUpperCase()}
                </StyledText>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        </StyledView>
        
        {/* Simple Bar Chart */}
        <StyledView className="flex-1">
          <StyledView className="flex-row items-end justify-between h-32">
            {prices.slice(-20).map((price, index) => {
              const height = priceRange > 0 ? ((price - minPrice) / priceRange) * 100 : 50;
              return (
                <StyledView
                  key={index}
                  className="bg-blue-500 rounded-sm"
                  style={{
                    width: (screenWidth - 80) / 20,
                    height: Math.max(2, height),
                    minHeight: 2,
                  }}
                />
              );
            })}
          </StyledView>
          <StyledView className="flex-row justify-between mt-2">
            <StyledText className="text-xs text-slate-500">
              ${minPrice.toFixed(2)}
            </StyledText>
            <StyledText className="text-xs text-slate-500">
              ${maxPrice.toFixed(2)}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>
    );
  };

  // Filter transactions for this specific token
  const tokenTransactions = transactions.filter(tx => 
    tx && tx.token && (
      (tx.token.symbol && token.symbol && tx.token.symbol.toLowerCase() === token.symbol.toLowerCase()) ||
      (tx.token.address && token.address && tx.token.address.toLowerCase() === token.address.toLowerCase())
    )
  ).slice(0, 5); // Show only last 5 transactions

  const formatTransactionAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatTransactionDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTransactionIcon = (type: 'send' | 'receive' | 'swap' | string) => {
    switch (type) {
      case 'send':
        return 'arrow-up';
      case 'receive':
        return 'arrow-down';
      case 'swap':
        return 'swap-horizontal';
      default:
        return 'arrow-forward';
    }
  };

  const getTransactionColor = (type: 'send' | 'receive' | 'swap' | string) => {
    switch (type) {
      case 'send':
        return 'text-red-600';
      case 'receive':
        return 'text-green-600';
      case 'swap':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  const getTransactionBgColor = (type: 'send' | 'receive' | 'swap' | string) => {
    switch (type) {
      case 'send':
        return 'bg-red-100';
      case 'receive':
        return 'bg-green-100';
      case 'swap':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <StyledSafeAreaView className="flex-1" style={{ backgroundColor: '#f8fafc' }}>
      {/* Background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgb(93,138,168)' }}
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
              className="mr-4 p-2 bg-white rounded-full shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </StyledTouchableOpacity>
            <StyledView className="flex-row items-center flex-1">
              {coinInfo?.image && typeof coinInfo.image === 'string' && coinInfo.image.trim() !== '' ? (
                <Image 
                  source={{ uri: coinInfo.image }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                  onError={() => {
                    // Fallback to placeholder if image fails to load
                    console.log('Failed to load image for', token.symbol);
                  }}
                />
              ) : (
                <StyledView className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
                  <StyledText className="text-gray-600 font-bold text-sm">
                    {token.symbol && token.symbol.length > 0 ? token.symbol.charAt(0).toUpperCase() : '?'}
                  </StyledText>
                </StyledView>
              )}
              <StyledView>
                <StyledText className="text-2xl font-bold text-slate-900">
                  {token.symbol || 'Unknown'}
                </StyledText>
                <StyledText className="text-slate-600">
                  {token.name || 'Unknown Token'}
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Price and Change Section */}
        {coinInfo && (
          <StyledView className="px-6 mb-6">
            <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row items-center justify-between mb-4">
                <StyledText className="text-3xl font-bold text-slate-900">
                  ${coinInfo.current_price && !isNaN(coinInfo.current_price) ? coinInfo.current_price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }) : '0.00'}
                </StyledText>
                <StyledView className={`flex-row items-center px-3 py-2 rounded-lg ${
                  (coinInfo.price_change_percentage_24h || 0) >= 0 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <Ionicons 
                    name={getPriceChangeIcon(coinInfo.price_change_percentage_24h || 0)} 
                    size={16} 
                    color={(coinInfo.price_change_percentage_24h || 0) >= 0 ? '#16a34a' : '#dc2626'} 
                  />
                  <StyledText className={`ml-1 font-semibold ${
                    getPriceChangeColor(coinInfo.price_change_percentage_24h || 0)
                  }`}>
                    {(coinInfo.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                    {(coinInfo.price_change_percentage_24h || 0).toFixed(2)}%
                  </StyledText>
                </StyledView>
              </StyledView>

              {/* Portfolio Allocation */}
              {currentWallet && (
                <StyledView className="mb-4 p-4 bg-white rounded-lg">
                  <StyledText className="text-sm text-slate-600 mb-2">Portfolio Allocation</StyledText>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-lg font-semibold text-slate-900">
                      {formatBalance(token.balance || '0', token.decimals)} {token.symbol || 'Unknown'}
                    </StyledText>
                    <StyledText className="text-sm text-slate-500">
                      {calculatePortfolioAllocation().toFixed(2)}% of portfolio
                    </StyledText>
                  </StyledView>
                  {token.usdValue && (
                    <StyledText className="text-sm text-slate-600 mt-1">
                      {formatUSDValue(token.usdValue)}
                    </StyledText>
                  )}
                </StyledView>
              )}

              {/* Live Balance Display */}
              <StyledView className="p-4 bg-white rounded-lg">
                <StyledText className="text-sm text-slate-600 mb-2">Your Balance</StyledText>
                <StyledView className="flex-row justify-between items-center mb-2">
                  <StyledText className="text-lg font-semibold text-slate-900">
                    {formatBalance(token.balance || '0', token.decimals)} {token.symbol || 'Unknown'}
                  </StyledText>
                  <StyledText className="text-sm text-slate-500">
                    ≈ {formatUSDValue(token.usdValue || 0)}
                  </StyledText>
                </StyledView>
                {coinInfo?.current_price && !isNaN(coinInfo.current_price) && (
                  <StyledText className="text-xs text-slate-500">
                    @ ${coinInfo.current_price.toFixed(6)} per {token.symbol || 'Unknown'}
                  </StyledText>
                )}
              </StyledView>
            </StyledView>
          </StyledView>
        )}

        {/* Chart Section */}
        <StyledView className="px-6 mb-6">
          {renderChart()}
        </StyledView>

        {/* Market Statistics */}
        {coinInfo && (
          <StyledView className="px-6 mb-6">
            <StyledText className="text-lg font-semibold text-slate-900 mb-4">
              Market Statistics
            </StyledText>
            
            <StyledView className="space-y-3">
              {coinInfo.market_cap && !isNaN(coinInfo.market_cap) && coinInfo.market_cap > 0 && (
                <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-slate-600">Market Cap</StyledText>
                    <StyledText className="text-slate-900 font-semibold">
                      {formatMarketCap(coinInfo.market_cap)}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.total_volume && !isNaN(coinInfo.total_volume) && coinInfo.total_volume > 0 && (
                <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-slate-600">24h Volume</StyledText>
                    <StyledText className="text-slate-900 font-semibold">
                      {formatUSDValue(coinInfo.total_volume)}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.circulating_supply && !isNaN(coinInfo.circulating_supply) && coinInfo.circulating_supply > 0 && (
                <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-slate-600">Circulating Supply</StyledText>
                    <StyledText className="text-slate-900 font-semibold">
                      {coinInfo.circulating_supply.toLocaleString()}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.market_cap_rank && !isNaN(coinInfo.market_cap_rank) && coinInfo.market_cap_rank > 0 && (
                <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-slate-600">Market Rank</StyledText>
                    <StyledText className="text-slate-900 font-semibold">
                      #{coinInfo.market_cap_rank}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}

              {coinInfo.ath && !isNaN(coinInfo.ath) && coinInfo.ath > 0 && (
                <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-slate-600">All Time High</StyledText>
                    <StyledText className="text-slate-900 font-semibold">
                      ${coinInfo.ath.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}
            </StyledView>
          </StyledView>
        )}

        {/* Actions */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Actions
          </StyledText>
          
          <StyledView className="space-y-3">
            <StyledTouchableOpacity
              onPress={() => {
                logger.logButtonPress('Send Token', 'navigate to send screen');
                // Navigate to send screen
              }}
              className="w-full py-4 bg-blue-600 rounded-xl items-center"
            >
              <StyledText className="text-white font-semibold text-base">
                Send
              </StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity
              onPress={() => {
                logger.logButtonPress('Swap Token', 'navigate to swap screen');
                navigation.goBack();
              }}
              className="w-full py-4 bg-white border border-blue-600 rounded-xl items-center"
            >
              <StyledText className="text-blue-600 font-semibold text-base">
                Swap
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>

        {/* Recent Transactions */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Recent Transactions
          </StyledText>
          
          {tokenTransactions.length > 0 ? (
            <StyledView className="space-y-3">
              {tokenTransactions.map((tx, index) => (
                <StyledView 
                  key={`${tx.hash}-${index}`}
                  className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" 
                  style={{ backgroundColor: '#e8eff3' }}
                >
                  <StyledView className="flex-row items-center justify-between mb-2">
                    <StyledView className="flex-row items-center">
                      <StyledView className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${getTransactionBgColor(tx.type || 'unknown')}`}>
                        <Ionicons 
                          name={getTransactionIcon(tx.type || 'unknown') as any} 
                          size={16} 
                          color={(tx.type || 'unknown') === 'send' ? '#dc2626' : (tx.type || 'unknown') === 'receive' ? '#16a34a' : '#2563eb'} 
                        />
                      </StyledView>
                      <StyledView>
                                              <StyledText className="text-slate-900 font-medium capitalize">
                        {tx.type || 'Unknown'}
                      </StyledText>
                      <StyledText className="text-xs text-slate-500">
                        {tx.timestamp ? formatTransactionDate(tx.timestamp) : 'Unknown time'}
                      </StyledText>
                      </StyledView>
                    </StyledView>
                    <StyledView className="items-end">
                                              <StyledText className={`font-semibold ${getTransactionColor(tx.type || 'unknown')}`}>
                          {(tx.type || 'unknown') === 'send' ? '-' : '+'}
                          {formatTransactionAmount(tx.amount || '0', tx.token?.decimals || 18)} {tx.token?.symbol || 'Unknown'}
                        </StyledText>
                      <StyledView className={`px-2 py-1 rounded-full ${
                        (tx.status || 'unknown') === 'confirmed' ? 'bg-green-100' : 
                        (tx.status || 'unknown') === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <StyledText className={`text-xs font-medium ${
                          (tx.status || 'unknown') === 'confirmed' ? 'text-green-700' : 
                          (tx.status || 'unknown') === 'pending' ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                          {tx.status || 'Unknown'}
                        </StyledText>
                      </StyledView>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-xs text-slate-500">
                      {(tx.type || 'unknown') === 'send' ? 'To:' : 'From:'} {(tx.type || 'unknown') === 'send' ? (tx.to || 'Unknown') : (tx.from || 'Unknown')}
                    </StyledText>
                    <StyledText className="text-xs text-slate-500">
                      {tx.hash && tx.hash.length > 14 ? `${tx.hash.substring(0, 8)}...${tx.hash.substring(tx.hash.length - 6)}` : 'Unknown hash'}
                    </StyledText>
                  </StyledView>
                </StyledView>
              ))}
            </StyledView>
          ) : (
            <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl items-center" style={{ backgroundColor: '#e8eff3' }}>
              <Ionicons name="receipt-outline" size={48} color="#64748b" />
              <StyledText className="text-slate-500 mt-2 text-center">
                No transactions found for {token.symbol || 'Unknown'}
              </StyledText>
              <StyledText className="text-slate-400 text-sm text-center mt-1">
                Your transaction history for this token will appear here
              </StyledText>
            </StyledView>
          )}
        </StyledView>

        {/* Additional Space */}
        <StyledView className="h-6" />
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 