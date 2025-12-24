import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { priceService, CoinInfo, ChartData } from '../services/api/priceService';
import { priceCacheService } from '../services/priceCacheService';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { logger } from '../utils/logger';
import { SparklineChart, UniversalBackground, CustomLoadingAnimation } from '../components';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type TokenDetailsRouteProp = RouteProp<RootStackParamList, 'TokenDetails'>;

export const TokenDetailsScreen: React.FC = () => {
  const route = useRoute<TokenDetailsRouteProp>();
  const navigation = useNavigation();
  const { token } = route.params;
  const { currentWallet } = useWalletStore();
  
  // Validate token object
  if (!token || !token.symbol) {
    return (
      <UniversalBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontSize: 18, color: '#94A3B8', textAlign: 'center' }}>
              Invalid token data. Please try again.
            </Text>
          </View>
        </SafeAreaView>
      </UniversalBackground>
    );
  }
  
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceSource, setPriceSource] = useState<string>('none');
  const [priceChangePercentage, setPriceChangePercentage] = useState<number>(0);
  const tradingViewSymbol = useMemo(() => {
    const symbol = token.symbol?.toUpperCase();
    if (!symbol) return null;

    const directMap: Record<string, string> = {
      BTC: 'BINANCE:BTCUSDT',
      ETH: 'BINANCE:ETHUSDT',
      SOL: 'BINANCE:SOLUSDT',
      XRP: 'BINANCE:XRPUSDT',
      ADA: 'BINANCE:ADAUSDT',
      TRX: 'BINANCE:TRXUSDT',
      DOGE: 'BINANCE:DOGEUSDT',
      BNB: 'BINANCE:BNBUSDT',
      LTC: 'BINANCE:LTCUSDT',
      MATIC: 'BINANCE:MATICUSDT',
      AVAX: 'BINANCE:AVAXUSDT',
      DOT: 'BINANCE:DOTUSDT',
      LINK: 'BINANCE:LINKUSDT',
      SHIB: 'BINANCE:SHIBUSDT',
      ATOM: 'BINANCE:ATOMUSDT',
      NEAR: 'BINANCE:NEARUSDT',
      UNI: 'BINANCE:UNIUSDT',
      ETC: 'BINANCE:ETCUSDT',
      BCH: 'BINANCE:BCHUSDT',
      APT: 'BINANCE:APTUSDT',
      OP: 'BINANCE:OPUSDT',
      ARB: 'BINANCE:ARBUSDT',
      SUI: 'BINANCE:SUIUSDT',
    };

    if (directMap[symbol]) {
      return directMap[symbol];
    }

    if (symbol === 'USDT') {
      return 'FX_IDC:USDTUSD';
    }

    if (symbol === 'USDC') {
      return 'FX_IDC:USDCUSD';
    }

    if (symbol.length <= 5) {
      return `BINANCE:${symbol}USDT`;
    }

    return null;
  }, [token.symbol]);

  const tradingViewHtml = useMemo(() => {
    if (!tradingViewSymbol) return null;
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <style>
      html, body, #chart-container {
        margin: 0;
        padding: 0;
        background: #000000;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="chart-container"></div>
    <script type="text/javascript">
      new TradingView.widget({
        autosize: true,
        symbol: "${tradingViewSymbol}",
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "3",
        locale: "en",
        toolbar_bg: "#000000",
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: "chart-container",
        hide_sidebar: true,
        calendar: true,
        studies: ["RSI@tv-basicstudies"],
      });
    </script>
  </body>
</html>
    `;
  }, [tradingViewSymbol]);


  // Get token logo URI from current wallet
  const getTokenLogoURI = () => {
    if (!currentWallet || !currentWallet.tokens) return null;
    
    const tokenData = currentWallet.tokens.find(t => 
      t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
    );
    
    return tokenData?.logoURI || null;
  };

  // Get token balance from current wallet
  const getTokenBalance = () => {
    if (!currentWallet || !currentWallet.tokens) {
      console.log('🔍 TokenDetails: No currentWallet or tokens');
      return '0.00';
    }
    
    const tokenData = currentWallet.tokens.find(t => 
      t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
    );
    
    console.log('🔍 TokenDetails: Looking for token:', token.symbol?.toLowerCase());
    console.log('🔍 TokenDetails: Available tokens:', currentWallet.tokens.map(t => t.symbol));
    console.log('🔍 TokenDetails: Found tokenData:', tokenData);
    
    if (!tokenData || !tokenData.balance) {
      console.log('🔍 TokenDetails: No tokenData or balance found');
      return '0.00';
    }
    
    // Handle balance as number (from dev-wallet.json format)
    const balance = typeof tokenData.balance === 'number' 
      ? tokenData.balance 
      : parseFloat(tokenData.balance);
    
    if (isNaN(balance)) return '0.00';
    
    // For small balances, show more decimal places
    if (balance < 1) {
      return balance.toFixed(6);
    }
    
    // For larger balances, show fewer decimal places
    if (balance < 1000) {
      return balance.toFixed(4);
    }
    
    return balance.toFixed(2);
  };

  // Load current price when component mounts or data changes
  useEffect(() => {
    const loadCurrentPrice = async () => {
      const { price, priceSource: source } = await getCurrentPrice();
      setCurrentPrice(price);
      setPriceSource(source);
      
      // Also load price change percentage
      const changePercentage = getPriceChangePercentage();
      setPriceChangePercentage(changePercentage);
    };
    
    loadCurrentPrice();
  }, [currentWallet, coinInfo, token]);

  // Get token USD value
  const getTokenUSDValue = () => {
    if (!currentWallet || !currentWallet.tokens) return 0;
    
    const tokenData = currentWallet.tokens.find(t => 
      t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
    );
    
    if (!tokenData || !tokenData.balance) return 0;
    
    // Calculate USD value: balance × current price
    const balance = typeof tokenData.balance === 'number' 
      ? tokenData.balance 
      : parseFloat(tokenData.balance);
    
    if (isNaN(balance)) return 0;
    
    // Use current price from state (which includes fallback logic)
    const usdValue = balance * currentPrice;
    
    console.log('🔍 TokenDetails: USD Value Calculation:', {
      balance,
      currentPrice,
      usdValue,
      symbol: token.symbol
    });
    
    return usdValue;
  };

  // Get current price
  const getCurrentPrice = async () => {
    let price = 0;
    let priceSource = 'none';
    
    // 1. First try to get price from dev wallet live data
    if (currentWallet && currentWallet.tokens) {
      const tokenData = currentWallet.tokens.find(t => 
        t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
      );
      
      if (tokenData?.currentPrice && tokenData.currentPrice > 0) {
        price = tokenData.currentPrice;
        priceSource = 'dev_wallet_live';
        console.log('🔍 TokenDetails: Using dev wallet live price:', price);
        return { price, priceSource };
      }
    }
    
    // 2. Fallback to API data
    if (coinInfo?.current_price && coinInfo.current_price > 0) {
      price = coinInfo.current_price;
      priceSource = 'api_live';
    } else if (token.current_price && token.current_price > 0) {
      price = token.current_price;
      priceSource = 'token_param';
    }
    
    // 3. If still no price, try last live price from cache
    if (!price || price === 0) {
      const lastLivePrice = await priceCacheService.getLastLivePrice(token.symbol);
      if (lastLivePrice) {
        price = lastLivePrice;
        priceSource = 'last_live_cache';
        console.log('🔍 TokenDetails: Using last live price from cache:', price);
      }
    }
    
    // 4. Final fallback to mock prices
    if (!price || price === 0) {
      const symbolMap: Record<string, string> = {
        'btc': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'eth': '0x0000000000000000000000000000000000000000',
        'usdc': '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'bnb': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      };
      
      const address = symbolMap[token.symbol?.toLowerCase() || ''];
      if (address) {
        price = priceService.getTokenPrice(address);
        priceSource = 'mock_fallback';
      }
    }
    
    console.log('🔍 TokenDetails: Current Price:', {
      price,
      priceSource,
      coinInfoPrice: coinInfo?.current_price,
      tokenPrice: token.current_price,
      symbol: token.symbol
    });
    
    return { price, priceSource };
  };

  // Get price change percentage
  const getPriceChangePercentage = () => {
    let priceChange = 0;
    let changeSource = 'none';
    
    // 1. First try to get price change from dev wallet live data
    if (currentWallet && currentWallet.tokens) {
      const tokenData = currentWallet.tokens.find(t => 
        t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
      );
      
      if (tokenData?.priceChange24h !== undefined) {
        priceChange = tokenData.priceChange24h;
        changeSource = 'dev_wallet_live';
        console.log('🔍 TokenDetails: Using dev wallet price change:', priceChange);
        return priceChange;
      }
    }
    
    // 2. Fallback to API data
    if (coinInfo?.price_change_percentage_24h !== undefined) {
      priceChange = coinInfo.price_change_percentage_24h;
      changeSource = 'api_live';
    } else if (token.price_change_percentage_24h !== undefined) {
      priceChange = token.price_change_percentage_24h;
      changeSource = 'token_param';
    }
    
    // 3. If still no price change, use mock price changes
    if (priceChange === 0) {
      const symbolMap: Record<string, string> = {
        'btc': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'eth': '0x0000000000000000000000000000000000000000',
        'usdc': '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'bnb': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      };
      
      const address = symbolMap[token.symbol?.toLowerCase() || ''];
      if (address) {
        priceChange = priceService.getTokenPriceChange(address);
        changeSource = 'mock_fallback';
      }
    }
    
    console.log('🔍 TokenDetails: Price Change:', {
      priceChange,
      changeSource,
      coinInfoChange: coinInfo?.price_change_percentage_24h,
      tokenChange: token.price_change_percentage_24h,
      symbol: token.symbol
    });
    
    return priceChange;
  };

  // Get price change value
  const getPriceChangeValue = () => {
    return (currentPrice * priceChangePercentage) / 100;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Get chart data based on selected timeframe
  const getChartData = () => {
    if (!chartData || !chartData.prices || chartData.prices.length === 0) {
      // Fallback to basic chart data if API fails
      return generateFallbackChartData();
    }

    // Filter data based on selected timeframe
    const now = Date.now();
    let cutoffTime = now;
    
    switch (selectedTimeframe) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000); // 1 hour ago
        break;
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case '30d':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
    }

    // Filter prices within the timeframe and extract just the price values
    const filteredPrices = chartData.prices
      .filter(([timestamp, price]) => timestamp >= cutoffTime && price > 0)
      .map(([timestamp, price]) => price);

    return filteredPrices.length > 0 ? filteredPrices : chartData.prices.map(([timestamp, price]) => price);
  };

  // Generate fallback chart data when API is unavailable
  const generateFallbackChartData = () => {
    const dataPoints = 50;
    const data = [];
    const basePrice = currentPrice || 1000; // Use current price from state or fallback
    const volatility = 0.02; // 2% volatility
    
    // Generate realistic price movement based on the current price
    let simulatedPrice = basePrice;
    
    for (let i = 0; i < dataPoints; i++) {
      // Add some trend based on price change percentage
      const trend = priceChangePercentage > 0 ? 0.001 : -0.001;
      const randomChange = (Math.random() - 0.5) * volatility + trend;
      simulatedPrice = simulatedPrice * (1 + randomChange);
      data.push(simulatedPrice);
    }
    
    console.log('📊 TokenDetails: Generated fallback chart data with base price:', basePrice);
    
    return data;
  };

  // Get timeframe label for display
  const getTimeframeLabel = () => {
    switch (selectedTimeframe) {
      case '1h': return '1H';
      case '24h': return '24H';
      case '7d': return '1W';
      case '30d': return '1M';
      default: return '24H';
    }
  };

  const loadTokenData = async () => {
    try {
      setIsLoading(true);
      setIsLoadingChart(true);
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
        priceService.fetchTopCoins(1, 1).then(result => {
          if (result.success && result.data.length > 0) {
            return { success: true, data: result.data[0] };
          }
          return { success: false, data: null };
        }),
        priceService.fetchChartData(coinGeckoId, 30)
      ]);

      if (coinInfoResult.success && coinInfoResult.data) {
        setCoinInfo(coinInfoResult.data);
      }

      if (chartDataResult.success && chartDataResult.data) {
        setChartData(chartDataResult.data);
      }
    } catch (err) {
      console.log('Failed to load token data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load token data');
    } finally {
      setIsLoading(false);
      setIsLoadingChart(false);
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

  // Reload chart data when timeframe changes
  useEffect(() => {
    if (chartData && selectedTimeframe) {
      // Chart data is already loaded, just update the view
      // The getChartData function will filter based on selectedTimeframe
    }
  }, [selectedTimeframe, chartData]);

  const timeframes = [
    { key: '1h', label: '1H' },
    { key: '24h', label: '24H' },
    { key: '7d', label: '1W' },
    { key: '30d', label: '1M' },
  ];

  const chartDataPoints = getChartData();
  const isPositive = priceChangePercentage >= 0;
  const tokenBalance = getTokenBalance();
  const tokenUSDValue = getTokenUSDValue();
  const priceChangeValue = getPriceChangeValue();
  const canRenderTradingView = tradingViewHtml && Platform.OS !== 'web';

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#0b1120',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {getTokenLogoURI() ? (
                <Image 
                  source={{ uri: getTokenLogoURI() }} 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 12,
                  }}
                  onError={() => {
                    // Fallback to placeholder if image fails to load
                    console.log('Failed to load logo for', token.symbol);
                  }}
                />
              ) : (
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#f59e0b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                    {token.symbol?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                  {token.name || token.symbol}
                </Text>
                <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                  {token.symbol?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons 
                name={isFavorite ? "star" : "star-outline"} 
                size={20} 
                color={isFavorite ? "#f59e0b" : "#64748b"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                Exchange
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Section */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 24,
          backgroundColor: 'transparent',
        }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 8,
          }}>
            {formatCurrency(currentPrice)}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={isPositive ? "trending-up" : "trending-down"} 
              size={16} 
              color={isPositive ? "#22c55e" : "#ef4444"} 
              style={{ marginRight: 4 }}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: isPositive ? '#22c55e' : '#ef4444',
            }}>
                              {isPositive ? '+' : ''}{formatCurrency(priceChangeValue)} ({priceChangePercentage.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Chart Section */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            backgroundColor: 'transparent',
            marginBottom: 0,
          }}
        >
          <View
            style={{
              height: 520,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(30, 41, 59, 0.55)',
              backgroundColor: '#020617',
              marginBottom: 16,
            }}
          >
            {canRenderTradingView ? (
              <WebView
                key={tradingViewSymbol || 'fallback-chart'}
                source={{ html: tradingViewHtml! }}
                style={{ flex: 1, backgroundColor: '#020617' }}
                originWhitelist={['*']}
                javaScriptEnabled
                startInLoadingState
                renderLoading={() => (
                  <CustomLoadingAnimation
                    message="Loading chart..."
                    size="large"
                    variant="fullscreen"
                  />
                )}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                {isLoadingChart ? (
                  <CustomLoadingAnimation
                    message="Loading chart data..."
                    size="medium"
                    variant="inline"
                  />
                ) : chartDataPoints.length > 0 ? (
                  <SparklineChart
                    data={chartDataPoints}
                    width={screenWidth - 120}
                    height={260}
                    color={isPositive ? '#22c55e' : '#ef4444'}
                    strokeWidth={2}
                  />
                ) : (
                  <>
                    <Ionicons name="trending-up" size={48} color="#94A3B8" />
                    <Text
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        color: '#94A3B8',
                        fontWeight: '500',
                      }}
                    >
                      Chart data unavailable
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          
        </View>

        {/* Holdings Section */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 0,
          backgroundColor: 'transparent',
          marginBottom: 0,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            {getTokenLogoURI() ? (
              <Image 
                source={{ uri: getTokenLogoURI() }} 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 16,
                }}
                onError={() => {
                  // Fallback to placeholder if image fails to load
                  console.log('Failed to load logo for', token.symbol);
                }}
              />
            ) : (
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#f59e0b',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
                  {token.symbol?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                {token.name || token.symbol}
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                {tokenBalance} {token.symbol?.toUpperCase()}
              </Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                {formatCurrency(tokenUSDValue)}
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                {priceChangePercentage.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: 'transparent',
            marginBottom: 8,
          }}
          onPress={() => {
            logger.logButtonPress('Transactions', 'view transaction history');
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            Transactions
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 24,
            backgroundColor: 'transparent',
            gap: 12,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#3b82f6',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => {
              logger.logButtonPress('Buy', `buy ${token.symbol}`);
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
              BUY
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#ef4444',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => {
              logger.logButtonPress('Sell', `sell ${token.symbol}`);
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
              SELL
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};