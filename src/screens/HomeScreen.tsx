import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Pressable, Alert, Dimensions, Modal, TextInput, StatusBar, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { Card } from '../components/common/Card';
import { PortfolioSkeleton, AnimatedButton, ParticleEffect, LoadingOverlay, RuneKeyLogo, UniversalBackground, CustomLoadingAnimation } from '../components';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { usePrices } from '../hooks/token/usePrices';
import { Token } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { priceService, CoinInfo } from '../services/api/priceService';
import { logger } from '../utils/logger';
import { formatBalance as formatBalanceFromUtils } from '../utils/formatters';
import { useThemeColors } from '../utils/theme';
import investingData from '../mockData/api/investing.json';
import { investingService } from '../services/api/investingService';
import { Investment } from '../types';

/** Local callable wrapper — guards Metro/web interop where named import can be non-function. */
function formatBalance(balance: string | number | undefined, decimals: number = 18): string {
  if (typeof formatBalanceFromUtils === 'function') {
    return formatBalanceFromUtils(balance, decimals);
  }
  if (balance === undefined || balance === null || balance === '') return '0';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 0.001) return '<0.001';
  if (num < 1) return num.toFixed(6);
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

const initialInvestingHoldings: Investment[] = Array.isArray((investingData as any)?.investments)
  ? ((investingData as any).investments as Investment[])
  : [];

const { width: screenWidth } = Dimensions.get('window');

type AssetFilter = 'all' | 'gainer' | 'loser';

export const HomeScreen: React.FC = () => {
  const colors = useThemeColors();
  const { isConnected, currentWallet, activeNetwork, watchlist, addToWatchlist } = useWalletStore();
  const { connectDevWallet, refreshDevWallet } = useDevWallet();
  const { fetchPrices, startPriceRefresh, isLoading: isLoadingPrices, getTokenPrice, getTokenPriceChange } = usePrices();
  const [loadingData, setLoadingData] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [marketData, setMarketData] = useState<CoinInfo[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<AssetFilter>('all');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedTokenForAlert, setSelectedTokenForAlert] = useState<any>(null);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');
  const [investmentHoldings, setInvestmentHoldings] = useState<any[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const navigation = useNavigation<any>();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);

  const loadInvestmentQuotes = useCallback(async () => {
    if (investmentHoldings.length === 0) return;
    setLoadingInvestments(true);
    try {
      const response = await investingService.fetchQuotes(investmentHoldings);
      const quotes = response.data || {};
      const holdingsWithPrices = investmentHoldings.map((investment) => {
        const symbol = investment.symbol.toUpperCase();
        const quote = quotes[symbol];
        const currentPrice = typeof quote?.price === 'number' && Number.isFinite(quote.price)
          ? quote.price
          : investment.averagePrice || 0;
        const changePercent = typeof quote?.changePercent === 'number' && Number.isFinite(quote.changePercent)
          ? quote.changePercent
          : 0;
        const marketValue = investment.quantity * currentPrice;
        return { ...investment, currentPrice, changePercent, marketValue, assetType: 'investment' as const };
      });
      setInvestmentHoldings(holdingsWithPrices);
    } catch (error) {
      console.error('Error loading investment quotes:', error);
    } finally {
      setLoadingInvestments(false);
    }
  }, [investmentHoldings]);

  const loadMarketData = async () => {
    setLoadingMarketData(true);
    try {
      const result = await priceService.fetchMarketData(20);
      if (result.success && result.data) {
        setMarketData(result.data);
        logger.logButtonPress('HomeScreen', 'load market data');
      } else {
        console.log('⚠️ Using fallback market data due to API failure');
        setMarketData([
          { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 51200, market_cap: 1000000000000, market_cap_rank: 1, total_volume: 25000000000, high_24h: 52000, low_24h: 50000, price_change_24h: 1200, price_change_percentage_24h: 2.4, market_cap_change_24h: 24000000000, market_cap_change_percentage_24h: 2.4, circulating_supply: 19500000, total_supply: 21000000, max_supply: 21000000, ath: 69000, ath_change_percentage: -25.8, ath_date: '2021-11-10T14:24:11.849Z', atl: 67.81, atl_change_percentage: 75400.0, atl_date: '2013-07-06T00:00:00.000Z', last_updated: new Date().toISOString() },
          { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3200, market_cap: 400000000000, market_cap_rank: 2, total_volume: 15000000000, high_24h: 3300, low_24h: 3100, price_change_24h: 100, price_change_percentage_24h: 3.2, market_cap_change_24h: 12000000000, market_cap_change_percentage_24h: 3.2, circulating_supply: 120000000, total_supply: 120000000, max_supply: 0, ath: 4800, ath_change_percentage: -33.3, ath_date: '2021-11-10T14:24:11.849Z', atl: 0.432979, atl_change_percentage: 740000.0, atl_date: '2015-10-20T00:00:00.000Z', last_updated: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
      setMarketData([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 2509.75, market_cap: 500000000000, market_cap_rank: 1, total_volume: 25000000000, high_24h: 2600, low_24h: 2400, price_change_24h: 225.75, price_change_percentage_24h: 9.77, market_cap_change_24h: 45000000000, market_cap_change_percentage_24h: 9.77, circulating_supply: 19500000, total_supply: 21000000, max_supply: 21000000, ath: 69000, ath_change_percentage: -63.6, ath_date: '2021-11-10T14:24:11.849Z', atl: 67.81, atl_change_percentage: 3600.0, atl_date: '2013-07-06T00:00:00.000Z', last_updated: new Date().toISOString() },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 2509.75, market_cap: 300000000000, market_cap_rank: 2, total_volume: 15000000000, high_24h: 2800, low_24h: 2400, price_change_24h: -525.25, price_change_percentage_24h: -21.00, market_cap_change_24h: -80000000000, market_cap_change_percentage_24h: -21.00, circulating_supply: 120000000, total_supply: 120000000, max_supply: 0, ath: 4800, ath_change_percentage: -47.7, ath_date: '2021-11-10T14:24:11.849Z', atl: 0.432979, atl_change_percentage: 580000.0, atl_date: '2015-10-20T00:00:00.000Z', last_updated: new Date().toISOString() },
        { id: 'band-protocol', symbol: 'band', name: 'Band Protocol', image: 'https://assets.coingecko.com/coins/images/9545/large/band-protocol.png', current_price: 553.06, market_cap: 5000000000, market_cap_rank: 50, total_volume: 50000000, high_24h: 600, low_24h: 500, price_change_24h: -165.94, price_change_percentage_24h: -22.97, market_cap_change_24h: -1500000000, market_cap_change_percentage_24h: -22.97, circulating_supply: 9000000, total_supply: 100000000, max_supply: 100000000, ath: 2000, ath_change_percentage: -72.3, ath_date: '2021-04-15T00:00:00.000Z', atl: 0.2, atl_change_percentage: 276000.0, atl_date: '2019-09-20T00:00:00.000Z', last_updated: new Date().toISOString() },
        { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 105.06, market_cap: 40000000000, market_cap_rank: 8, total_volume: 2000000000, high_24h: 110, low_24h: 90, price_change_24h: 14.94, price_change_percentage_24h: 16.31, market_cap_change_24h: 6000000000, market_cap_change_percentage_24h: 16.31, circulating_supply: 38000000000, total_supply: 38000000000, max_supply: 0, ath: 3.1, ath_change_percentage: -46.2, ath_date: '2021-01-07T14:24:11.849Z', atl: 0.03, atl_change_percentage: 350000.0, atl_date: '2017-07-24T00:00:00.000Z', last_updated: new Date().toISOString() },
      ]);
    } finally {
      setLoadingMarketData(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setLoadingData(true);
    await loadMarketData();
    setLoadingData(false);
    if (currentWallet?.tokens) {
      const tokenAddresses = currentWallet.tokens.map((t: Token) => t.address);
      await fetchPrices(tokenAddresses);
      startPriceRefresh(tokenAddresses);
    }
  }, [currentWallet?.tokens, fetchPrices, startPriceRefresh]);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerTranslateY.value = withSpring(0, { damping: 20, stiffness: 100 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isConnected && !isConnectingWallet) {
        setIsConnectingWallet(true);
        connectDevWallet().finally(() => {
          setIsConnectingWallet(false);
        });
      }
    }, [isConnected, isConnectingWallet, connectDevWallet])
  );

  useEffect(() => {
    if (currentWallet?.tokens) {
      const tokenAddresses = currentWallet.tokens.map((t: Token) => t.address);
      fetchPrices(tokenAddresses);
      startPriceRefresh(tokenAddresses);
    }
  }, [currentWallet?.tokens, fetchPrices, startPriceRefresh]);

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? colors.success : colors.error;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Portfolio USD = sum of each token's usdValue (balance × live/fallback price).
  // Do not use native wallet.balance × tokens[0].price — that ignored all holdings
  // and showed $0 when mock native balance was empty.
  const portfolioTotalUsd =
    currentWallet?.tokens?.reduce((sum: number, t: Token) => sum + (t.usdValue || 0), 0) || 0;
  const tokenCount = currentWallet?.tokens?.length || 0;

  return (
    <UniversalBackground>
      <StatusBar barStyle={colors.textPrimary === '#F8FAFC' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingOverlay 
          visible={loadingData || isConnectingWallet || loadingMarketData}
          message={isConnectingWallet ? "Connecting Wallet..." : loadingMarketData ? "Loading Market Data..." : "Loading Data..."}
          spinnerSize="large"
          spinnerColor={colors.primary}
        />
        <ParticleEffect type="confetti" active={showParticles} onComplete={() => setShowParticles(false)} />

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={loadingMarketData} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RuneKeyLogo size="sm" color="primary" showText={false} showDot={false} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 }}>
              RuneKey
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Card style={{ borderRadius: 16, padding: 16 }}>
              {isConnected ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, overflow: 'hidden' }}>
                    <View style={{ flex: 1, flexShrink: 1, minWidth: 0, marginRight: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: '#0F172A' }} numberOfLines={1} ellipsizeMode="middle">{currentWallet?.address || 'No wallet connected'}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>{NETWORK_CONFIGS[activeNetwork]?.name || 'Ethereum'}</Text>
                    </View>
                    <TouchableOpacity style={{ padding: 8, flexShrink: 0 }} onPress={() => useWalletStore.getState().disconnectWallet()} accessibilityLabel="Disconnect wallet">
                      <Ionicons name="log-out" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#0F172A' }}>{formatCurrency(portfolioTotalUsd)}</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Total Balance</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>{formatCurrency(portfolioTotalUsd)}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>Assets</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>{tokenCount}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>Tokens</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <RuneKeyLogo size="xl" color="primary" showText={false} />
                  <Text style={{ fontSize: 20, fontWeight: '600', color: '#0F172A', marginTop: 16 }}>Connect Your Wallet</Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, maxWidth: 280 }}>Manage your crypto assets, swap tokens, and track your portfolio</Text>
                  <AnimatedButton onPress={() => { setIsConnectingWallet(true); connectDevWallet().finally(() => setIsConnectingWallet(false)); }} title="Connect Dev Wallet" variant="primary" fullWidth style={{ marginTop: 16 }} />
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Demo wallet with mock data - no real funds</Text>
                </View>
              )}
            </Card>
          </View>

          {isConnected && currentWallet?.tokens.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Card
                accessibilityLabel="Open portfolio token list"
                onPress={() => {
                  logger.logButtonPress('HomeScreen', 'open portfolio tokens');
                  setShowPortfolioModal(true);
                }}
              >
                {/* Header: pointerEvents none so Android elevated/Image children don't swallow Pressable taps */}
                <View pointerEvents="none" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>Portfolio</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>{formatCurrency(portfolioTotalUsd)} total</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </View>
                </View>
                {/* Horizontal pans → ScrollView; chip content non-interactive so single tap still opens modal */}
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator
                  persistentScrollbar
                  bounces={false}
                  nativeID={PORTFOLIO_CHIPS_SCROLL_CLASS}
                  className={Platform.OS === 'web' ? PORTFOLIO_CHIPS_SCROLL_CLASS : undefined}
                  style={[
                    styles.portfolioChipsScroll,
                    Platform.OS === 'web' ? webPortfolioChipsScrollbarStyle : null,
                  ]}
                  contentContainerStyle={styles.portfolioChipsContent}
                >
                  {currentWallet.tokens.map((token: any) => (
                    <View
                      key={token.address}
                      pointerEvents="none"
                      style={styles.portfolioChip}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                        <Image source={{ uri: token.logoURI || `https://via.placeholder.com/40?text=${token.symbol}` }} style={{ width: '100%', height: '100%', borderRadius: 10 }} defaultSource={require('../../assets/icon.png')} />
                      </View>
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{token.symbol}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>{formatBalance(token.balance, token.decimals)}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: getPriceChangeColor(token.priceChange24h || 0) }}>{token.priceChange24h !== undefined && token.priceChange24h !== null ? (token.priceChange24h >= 0 ? '▲' : '▼') : ''} {token.priceChange24h !== undefined && token.priceChange24h !== null ? Math.abs(token.priceChange24h).toFixed(2) + '%' : ''}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </Card>
            </View>
          )}

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Card style={{ borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>Market Overview</Text>
                <TouchableOpacity onPress={loadMarketData}><Ionicons name="reload" size={18} color={colors.textSecondary} /></TouchableOpacity>
              </View>
              {loadingMarketData ? <PortfolioSkeleton /> : (
                <View style={{ gap: 8 }}>
                  {marketData.slice(0, 4).map((coin) => (
                    <TouchableOpacity key={coin.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 }}>
                      <Image source={{ uri: coin.image }} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9' }} defaultSource={require('../../assets/icon.png')} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>{coin.name}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>{coin.symbol.toUpperCase()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{formatCurrency(coin.current_price)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: getPriceChangeColor(coin.price_change_percentage_24h || 0) }}>{coin.price_change_percentage_24h !== undefined && coin.price_change_percentage_24h !== null ? (coin.price_change_percentage_24h >= 0 ? '▲' : '▼') : ''} {coin.price_change_percentage_24h !== undefined && coin.price_change_percentage_24h !== null ? Math.abs(coin.price_change_percentage_24h).toFixed(2) + '%' : ''}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Card style={{ borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>Quick Actions</Text>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Common operations</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'column', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 }}>
                  <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.primary} />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Swap</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'column', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 }}>
                  <MaterialCommunityIcons name="send" size={24} color={colors.primary} />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'column', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 }}>
                  <MaterialCommunityIcons name="download" size={24} color={colors.primary} />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Receive</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'column', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2 }}>
                  <MaterialCommunityIcons name="chart-areaspline" size={24} color={colors.primary} />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>

          {showAlertModal && (
            <Modal transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '90%', borderRadius: 16, padding: 20, elevation: 8, backgroundColor: '#FFFFFF' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>Set Price Alert</Text>
                    <TouchableOpacity onPress={() => setShowAlertModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                  </View>
                  <View style={{ gap: 12 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Token</Text>
                    <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '500' }}>{selectedTokenForAlert?.symbol || 'Select token'}</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Direction</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[styles.directionButton, alertDirection === 'above' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => setAlertDirection('above')}>
                        <Text style={[styles.directionButtonText, alertDirection === 'above' && { color: colors.primary }]}>Above</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.directionButton, alertDirection === 'below' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={() => setAlertDirection('below')}>
                        <Text style={[styles.directionButtonText, alertDirection === 'below' && { color: colors.primary }]}>Below</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Target Price</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border }]} value={alertTargetPrice} onChangeText={setAlertTargetPrice} keyboardType="decimal-pad" placeholder="0.00" />
                  </View>
                  <View style={{ marginTop: 16, alignItems: 'center' }}>
                    <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.primary }]} onPress={() => {
                      if (selectedTokenForAlert && alertTargetPrice) {
                        addToWatchlist(selectedTokenForAlert.symbol, { targetPrice: parseFloat(alertTargetPrice), direction: alertDirection });
                        setShowAlertModal(false);
                        Alert.alert('Success', `Price alert set for ${selectedTokenForAlert.symbol}`);
                      }
                    }}>
                      <Text style={styles.confirmButtonText}>Set Alert</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {loadingMarketData && <View style={{ paddingVertical: 24, alignItems: 'center' }}><CustomLoadingAnimation /></View>}
        </ScrollView>

      </SafeAreaView>

      {/* Modal at screen root (outside SafeAreaView) so Android/iOS present above tab chrome */}
      <Modal
        transparent
        animationType="slide"
        visible={showPortfolioModal}
        onRequestClose={() => setShowPortfolioModal(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
        hardwareAccelerated
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowPortfolioModal(false)}
            accessibilityLabel="Dismiss portfolio list"
            accessibilityRole="button"
          />
          <View
            style={{
              maxHeight: '80%',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: Platform.OS === 'ios' ? 28 : 20,
              backgroundColor: '#FFFFFF',
              elevation: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>Portfolio Tokens</Text>
              <Pressable
                onPress={() => setShowPortfolioModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close portfolio list"
                accessibilityRole="button"
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              {formatCurrency(portfolioTotalUsd)} total · {tokenCount} tokens
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: Dimensions.get('window').height * 0.55 }}
              bounces={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ gap: 8, paddingBottom: 8 }}>
                {(currentWallet?.tokens || []).map((token: any) => (
                  <View
                    key={token.address}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                      <Image
                        source={{ uri: token.logoURI || `https://via.placeholder.com/44?text=${token.symbol}` }}
                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                        defaultSource={require('../../assets/icon.png')}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>{token.symbol}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{token.name || token.symbol}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{formatBalance(token.balance, token.decimals)}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: getPriceChangeColor(token.priceChange24h || 0), marginTop: 2 }}>
                        {token.priceChange24h !== undefined && token.priceChange24h !== null ? (token.priceChange24h >= 0 ? '▲' : '▼') : ''}
                        {token.priceChange24h !== undefined && token.priceChange24h !== null ? ` ${Math.abs(token.priceChange24h).toFixed(2)}%` : ''}
                      </Text>
                      {typeof token.usdValue === 'number' && (
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{formatCurrency(token.usdValue)}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </UniversalBackground>
  );
};

/** Web-only: force a persistent thin horizontal scrollbar under portfolio chips (RN-web/CSS). */
const webPortfolioChipsScrollbarStyle = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#94A3B8 #E2E8F0',
  overflowX: 'scroll',
} as Record<string, string>;

const PORTFOLIO_CHIPS_SCROLL_CLASS = 'runekey-portfolio-chips-scroll';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'runekey-portfolio-chips-scrollbar';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      #${PORTFOLIO_CHIPS_SCROLL_CLASS},
      .${PORTFOLIO_CHIPS_SCROLL_CLASS} {
        scrollbar-width: thin;
        scrollbar-color: #94A3B8 #E2E8F0;
        overflow-x: scroll !important;
      }
      #${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar,
      .${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar {
        height: 8px;
        display: block;
      }
      #${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar-track,
      .${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar-track {
        background: #E2E8F0;
        border-radius: 4px;
      }
      #${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar-thumb,
      .${PORTFOLIO_CHIPS_SCROLL_CLASS}::-webkit-scrollbar-thumb {
        background: #94A3B8;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

const styles = StyleSheet.create({
  directionButton: { flex: 1, padding: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, alignItems: 'center' },
  directionButtonText: { fontSize: 12, color: '#6B7280' },
  input: { fontSize: 14, color: '#0F172A', padding: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: 8, borderColor: '#E2E8F0' },
  confirmButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  portfolioChipsScroll: {
    marginHorizontal: -2,
    // Room under chips for the horizontal scrollbar track
    paddingBottom: 6,
  },
  portfolioChipsContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
    paddingBottom: 4,
  },
  portfolioChip: {
    width: 128,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default HomeScreen;
