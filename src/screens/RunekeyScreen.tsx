import React, { useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing,
  withDelay
} from 'react-native-reanimated';
import { logger } from '../utils/logger';
import { 
  UniversalBackground,
  LiquidGlass,
  ParticleEffect,
  LoadingOverlay,
  AnimatedProgressBar,
} from '../components';
import { formatLargeCurrency, formatNumber } from '../utils/formatters';

export const RunekeyScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const balanceOverview = {
    totalValue: 284_950,
    cryptoValue: 172_430,
    usdtReserve: 48_200,
    equityValue: 64_320,
    buyingPower: 74_600,
    dayChange: 2.4,
  };

  const bridgeAllocation = Math.round(
    (balanceOverview.equityValue / (balanceOverview.cryptoValue + balanceOverview.equityValue)) * 100
  );

  const bridgeInsights = [
    {
      id: 'pending-conversions',
      label: 'Pending Conversions',
      value: '2 orders',
      icon: 'swap-horizontal',
    },
    {
      id: 'settlement-window',
      label: 'Next Settlement Window',
      value: '4h 12m',
      icon: 'time',
    },
    {
      id: 'margin-buffer',
      label: 'Reg-T Buffer',
      value: '$7,500.00',
      icon: 'shield-checkmark',
    },
  ];

  const cryptoPositions = [
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 24.6,
      value: 82_450,
      change: 1.8,
    },
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 1.2,
      value: 64_780,
      change: 3.2,
    },
    {
      id: 'matic',
      symbol: 'MATIC',
      name: 'Polygon',
      amount: 6_300,
      value: 18_920,
      change: -0.9,
    },
  ];

  const equityPositions = [
    {
      id: 'aapl',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 85,
      value: 14_320,
      change: 2.1,
    },
    {
      id: 'tsla',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 42,
      value: 9_640,
      change: -1.4,
    },
    {
      id: 'msft',
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      shares: 60,
      value: 11_280,
      change: 1.2,
    },
  ];

  const cryptoMovers = [
    { id: 'sol', label: 'SOL', value: 64.12, change: 4.8 },
    { id: 'avax', label: 'AVAX', value: 37.54, change: -2.3 },
    { id: 'link', label: 'LINK', value: 14.82, change: 6.5 },
  ];

  const equityMovers = [
    { id: 'nvda', label: 'NVDA', value: 412.37, change: 3.6 },
    { id: 'coin', label: 'COIN', value: 192.64, change: 5.1 },
    { id: 'arkk', label: 'ARKK', value: 48.12, change: -1.9 },
  ];

  const quickActions = [
    {
      id: 'deposit-usdt',
      title: 'Deposit USDT',
      description: 'Bring stablecoins into your vault',
      icon: 'arrow-down-circle',
      color: '#3B82F6',
    },
    {
      id: 'swap-crypto',
      title: 'Swap Crypto',
      description: 'Rebalance your token positions',
      icon: 'repeat',
      color: '#22C55E',
    },
    {
      id: 'buy-stock',
      title: 'Buy Stock',
      description: 'Convert USDT to new equities',
      icon: 'trending-up',
      color: '#F97316',
    },
    {
      id: 'auto-convert',
      title: 'Schedule Auto-Conversion',
      description: 'Automate nightly allocations',
      icon: 'calendar',
      color: '#8B5CF6',
    },
  ];

  const activityFeed = [
    {
      id: 'conversion',
      title: 'USDT Conversion Settled',
      description: 'Converted $12,500.00 USDT into AAPL & MSFT',
      timestamp: '1h ago',
      icon: 'checkmark-done-circle',
    },
    {
      id: 'dividend',
      title: 'Dividend Reinvested',
      description: '$124.32 from MSFT redirected to USDT reserve',
      timestamp: 'Yesterday',
      icon: 'cash',
    },
    {
      id: 'limit-order',
      title: 'Equity Order Submitted',
      description: 'Placed limit order to sell TSLA @ $245.00',
      timestamp: 'Nov 7',
      icon: 'paper-plane',
    },
  ];

  const educationCapsules = [
    {
      id: 'bridge-101',
      title: 'How the Rune Bridge Works',
      description: 'Understand funding flow, settlement windows, and collateral rules.',
      icon: 'trail-sign',
    },
    {
      id: 'compliance',
      title: 'Compliance & Reporting',
      description: 'KYC, AML, and tax documents for hybrid crypto-equity accounts.',
      icon: 'document-text',
    },
    {
      id: 'yield-strategy',
      title: 'Boost Buying Power with Yield',
      description: 'Earn passive yield on idle USDT while waiting for market entry.',
      icon: 'sparkles',
    },
  ];

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);

  const handleQuickActionPress = (actionId: string) => {
    logger.logButtonPress('Runekey Quick Action', actionId);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1800);

    const action = quickActions.find(item => item.id === actionId);
    if (!action) return;

    Alert.alert(action.title, `This would navigate to ${action.title}.`, [{ text: 'OK' }]);
  };

  const handleEducationPress = (capsuleId: string) => {
    logger.logButtonPress('Education Capsule', capsuleId);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1600);

    const capsule = educationCapsules.find(item => item.id === capsuleId);
    if (!capsule) return;

    Alert.alert(capsule.title, capsule.description, [{ text: 'Close' }]);
  };

  const handlePositionPress = (type: 'crypto' | 'equity', symbol: string) => {
    logger.logButtonPress('Bridge Position', `${type}-${symbol}`);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1600);

    Alert.alert(
      `${symbol} position`,
      `This would open detailed ${type === 'crypto' ? 'token' : 'equity'} analytics for ${symbol}.`,
      [{ text: 'Close' }]
    );
  };

  const handleMarketPress = (type: 'crypto' | 'equity', label: string) => {
    logger.logButtonPress('Bridge Market Tile', `${type}-${label}`);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1500);

    Alert.alert(
      `${label} ${type === 'crypto' ? 'token' : 'equity'}`,
      `Navigate to ${label} market details.`,
      [{ text: 'Close' }]
    );
  };

  const changeColor = (value: number) => (value >= 0 ? '#22C55E' : '#F97316');

  const formatChange = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  const formatPrice = (value: number) =>
    `$${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('RunekeyScreen');
      
      // Trigger animations
      headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      
      cardOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
      cardTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
      
      featuresOpacity.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
      featuresTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));
      
      statsOpacity.value = withDelay(600, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
      statsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
    }, [])
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    setShowParticles(true);
    
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setRefreshing(false);
    setShowParticles(false);
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={isLoading}
          message="Loading Runekey..."
          spinnerSize={60}
          spinnerColor="#3B82F6"
        />
        
        {/* Particle Effects */}
        <ParticleEffect 
          type="sparkles" 
          active={showParticles} 
        />
        
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <Animated.View style={[headerAnimatedStyle, styles.headerContainer]}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/icon.png')}
                  style={styles.logo}
                />
                <View style={styles.headerText}>
                  <Text style={styles.title}>Runekey</Text>
                  <Text style={styles.subtitle}>Your Digital Identity</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Combined Balance */}
          <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              className="p-6"
              variant="transparent"
            >
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>Runekey Bridge</Text>
                  <Text style={styles.heroSubtitle}>Crypto wallet + equity portfolio</Text>
                </View>
                <View style={styles.heroChip}>
                  <Ionicons name="trending-up" size={16} color="#22C55E" />
                  <Text style={styles.heroChipText}>{formatChange(balanceOverview.dayChange)} today</Text>
                </View>
              </View>

              <Text style={styles.heroBalance}>{formatLargeCurrency(balanceOverview.totalValue)}</Text>
              <Text style={styles.heroLabel}>Total holdings</Text>

              <View style={styles.heroStatGrid}>
                <View style={styles.heroStatCard}>
                  <Text style={styles.heroStatLabel}>Crypto Wallet</Text>
                  <Text style={styles.heroStatValue}>{formatLargeCurrency(balanceOverview.cryptoValue)}</Text>
                </View>
                <View style={styles.heroStatCard}>
                  <Text style={styles.heroStatLabel}>Equity Portfolio</Text>
                  <Text style={styles.heroStatValue}>{formatLargeCurrency(balanceOverview.equityValue)}</Text>
                </View>
                <View style={styles.heroStatCard}>
                  <Text style={styles.heroStatLabel}>Buying Power</Text>
                  <Text style={styles.heroStatValue}>{formatLargeCurrency(balanceOverview.buyingPower)}</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroFooterRow}>
                <View style={styles.heroFooterItem}>
                  <Text style={styles.heroFooterLabel}>USDT Reserve</Text>
                  <Text style={styles.heroFooterValue}>{formatLargeCurrency(balanceOverview.usdtReserve)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.heroFooterCTA}
                  activeOpacity={0.85}
                  onPress={() => handleQuickActionPress('deposit-usdt')}
                >
                  <Ionicons name="arrow-forward-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.heroFooterText}>Fund bridge</Text>
                </TouchableOpacity>
              </View>
            </LiquidGlass>
          </Animated.View>

          {/* Bridge Status */}
          <Animated.View style={[featuresAnimatedStyle, styles.sectionContainer]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              className="p-6"
              variant="transparent"
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bridge Status</Text>
                <View style={styles.bridgeChip}>
                  <Ionicons name="analytics" size={16} color="#38BDF8" />
                  <Text style={styles.bridgeChipText}>{bridgeAllocation}% in equities</Text>
                </View>
              </View>

              <AnimatedProgressBar
                progress={bridgeAllocation}
                height={10}
                color="#3B82F6"
                backgroundColor="rgba(59, 130, 246, 0.25)"
                className="mt-4"
              />

              <View style={styles.bridgeBreakdown}>
                <View style={styles.bridgeAllocationCard}>
                  <Text style={styles.bridgeAllocationLabel}>Allocation Split</Text>
                  <View style={styles.bridgeAllocationRow}>
                    <View style={styles.bridgeAllocationValue}>
                      <Ionicons name="wallet" size={16} color="#22C55E" />
                      <Text style={styles.bridgeAllocationText}>
                        {100 - bridgeAllocation}% crypto
                      </Text>
                    </View>
                    <View style={styles.bridgeAllocationValue}>
                      <Ionicons name="briefcase" size={16} color="#3B82F6" />
                      <Text style={styles.bridgeAllocationText}>
                        {bridgeAllocation}% equities
                      </Text>
                    </View>
                  </View>
                </View>

                {bridgeInsights.map(item => (
                  <View key={item.id} style={styles.bridgeInsight}>
                    <View style={styles.bridgeInsightIcon}>
                      <Ionicons name={item.icon as any} size={18} color="#94A3B8" />
                    </View>
                    <View style={styles.bridgeInsightContent}>
                      <Text style={styles.bridgeInsightLabel}>{item.label}</Text>
                      <Text style={styles.bridgeInsightValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </LiquidGlass>
          </Animated.View>

          {/* Holdings Snapshot */}
          <Animated.View style={[featuresAnimatedStyle, styles.sectionContainer]}>
            <Text style={styles.sectionTitle}>Holdings Snapshot</Text>

            <View style={styles.holdingsGrid}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.18}
                className="p-5"
                variant="transparent"
              >
                <Text style={styles.cardHeading}>Crypto Positions</Text>
                <View style={styles.positionList}>
                  {cryptoPositions.map(position => (
                    <TouchableOpacity
                      key={position.id}
                      style={styles.positionRow}
                      activeOpacity={0.85}
                      onPress={() => handlePositionPress('crypto', position.symbol)}
                    >
                      <View style={styles.tickerBadge}>
                        <Text style={styles.tickerBadgeText}>{position.symbol}</Text>
                      </View>
                      <View style={styles.positionInfo}>
                        <Text style={styles.positionName}>{position.name}</Text>
                        <Text style={styles.positionMeta}>
                          {formatNumber(position.amount, { maximumFractionDigits: 2, minimumFractionDigits: 0 })} {position.symbol}
                        </Text>
                      </View>
                      <View style={styles.positionValueBlock}>
                        <Text style={styles.positionValue}>{formatLargeCurrency(position.value)}</Text>
                        <Text style={[styles.positionChange, { color: changeColor(position.change) }]}>
                          {formatChange(position.change)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </LiquidGlass>

              <LiquidGlass
                cornerRadius={20}
                elasticity={0.18}
                className="p-5"
                variant="transparent"
              >
                <Text style={styles.cardHeading}>Stock Holdings</Text>
                <View style={styles.positionList}>
                  {equityPositions.map(position => (
                    <TouchableOpacity
                      key={position.id}
                      style={styles.positionRow}
                      activeOpacity={0.85}
                      onPress={() => handlePositionPress('equity', position.symbol)}
                    >
                      <View style={styles.tickerBadge}>
                        <Text style={styles.tickerBadgeText}>{position.symbol}</Text>
                      </View>
                      <View style={styles.positionInfo}>
                        <Text style={styles.positionName}>{position.name}</Text>
                        <Text style={styles.positionMeta}>
                          {formatNumber(position.shares, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} shares
                        </Text>
                      </View>
                      <View style={styles.positionValueBlock}>
                        <Text style={styles.positionValue}>{formatLargeCurrency(position.value)}</Text>
                        <Text style={[styles.positionChange, { color: changeColor(position.change) }]}>
                          {formatChange(position.change)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </LiquidGlass>
            </View>
          </Animated.View>

          {/* Market Signals */}
          <Animated.View style={[statsAnimatedStyle, styles.sectionContainer]}>
            <Text style={styles.sectionTitle}>Market Signals</Text>

            <View style={styles.marketGrid}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.18}
                className="p-5"
                variant="transparent"
              >
                <Text style={styles.cardHeading}>Crypto Movers</Text>
                {cryptoMovers.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.marketRow}
                    activeOpacity={0.85}
                    onPress={() => handleMarketPress('crypto', item.label)}
                  >
                    <View style={styles.tickerBadgeSmall}>
                      <Text style={styles.tickerBadgeText}>{item.label}</Text>
                    </View>
                    <View style={styles.marketInfo}>
                      <Text style={styles.marketValue}>{formatPrice(item.value)}</Text>
                      <Text style={[styles.marketChange, { color: changeColor(item.change) }]}>
                        {formatChange(item.change)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </LiquidGlass>

              <LiquidGlass
                cornerRadius={20}
                elasticity={0.18}
                className="p-5"
                variant="transparent"
              >
                <Text style={styles.cardHeading}>Equity Movers</Text>
                {equityMovers.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.marketRow}
                    activeOpacity={0.85}
                    onPress={() => handleMarketPress('equity', item.label)}
                  >
                    <View style={styles.tickerBadgeSmall}>
                      <Text style={styles.tickerBadgeText}>{item.label}</Text>
                    </View>
                    <View style={styles.marketInfo}>
                      <Text style={styles.marketValue}>{formatPrice(item.value)}</Text>
                      <Text style={[styles.marketChange, { color: changeColor(item.change) }]}>
                        {formatChange(item.change)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </LiquidGlass>
            </View>
          </Animated.View>

          {/* Bridge Activity */}
          <Animated.View style={[cardAnimatedStyle, styles.actionsContainer]}>
            <Text style={styles.sectionTitle}>Bridge Activity</Text>

            <View style={styles.activityStack}>
              {activityFeed.map(event => (
                <LiquidGlass
                  key={event.id}
                  cornerRadius={18}
                  elasticity={0.16}
                  className="p-4"
                  variant="transparent"
                >
                  <View style={styles.activityRow}>
                    <View style={styles.activityIcon}>
                      <Ionicons name={event.icon as any} size={20} color="#38BDF8" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{event.title}</Text>
                      <Text style={styles.activityDescription}>{event.description}</Text>
                    </View>
                    <Text style={styles.activityTimestamp}>{event.timestamp}</Text>
                  </View>
                </LiquidGlass>
              ))}
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={[cardAnimatedStyle, styles.actionsContainer]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              className="p-6"
              variant="transparent"
            >
              <Text style={styles.actionsTitle}>Take Action</Text>
              <Text style={styles.actionsSubtitle}>
                Keep the bridge funded, balanced, and ready when markets move.
              </Text>

              <View style={styles.quickActionsGrid}>
                {quickActions.map(action => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionCard}
                    activeOpacity={0.85}
                    onPress={() => handleQuickActionPress(action.id)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}1A` }]}>
                      <Ionicons name={action.icon as any} size={20} color={action.color} />
                    </View>
                    <View style={styles.quickActionContent}>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                      <Text style={styles.quickActionDescription}>{action.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#64748B" />
                  </TouchableOpacity>
                ))}
              </View>
            </LiquidGlass>
          </Animated.View>

          {/* Education */}
          <Animated.View style={[statsAnimatedStyle, styles.sectionContainer]}>
            <Text style={styles.sectionTitle}>Learn the Bridge</Text>

            <View style={styles.educationGrid}>
              {educationCapsules.map(capsule => (
                <TouchableOpacity
                  key={capsule.id}
                  activeOpacity={0.85}
                  onPress={() => handleEducationPress(capsule.id)}
                >
                  <LiquidGlass
                    cornerRadius={20}
                    elasticity={0.18}
                    className="p-5"
                    variant="transparent"
                  >
                    <View style={styles.educationCard}>
                      <View style={styles.educationIcon}>
                        <Ionicons name={capsule.icon as any} size={20} color="#A855F7" />
                      </View>
                      <View style={styles.educationContent}>
                        <Text style={styles.educationTitle}>{capsule.title}</Text>
                        <Text style={styles.educationDescription}>{capsule.description}</Text>
                      </View>
                    </View>
                  </LiquidGlass>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 102,
    height: 102,
    marginRight: 16,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 4,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  heroChipText: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 13,
  },
  heroBalance: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  heroStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
  },
  heroStatCard: {
    flexBasis: '30%',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  heroStatLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    marginVertical: 20,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroFooterItem: {
    gap: 6,
  },
  heroFooterLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  heroFooterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroFooterCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  heroFooterText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bridgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  bridgeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  bridgeBreakdown: {
    marginTop: 24,
    gap: 18,
  },
  bridgeAllocationCard: {
    backgroundColor: 'rgba(23, 37, 84, 0.45)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bridgeAllocationLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  bridgeAllocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bridgeAllocationValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bridgeAllocationText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  bridgeInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bridgeInsightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  bridgeInsightContent: {
    flex: 1,
  },
  bridgeInsightLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  bridgeInsightValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  holdingsGrid: {
    gap: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 16,
  },
  positionList: {
    gap: 14,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tickerBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  tickerBadgeSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  tickerBadgeText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
  },
  positionInfo: {
    flex: 1,
  },
  positionName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  positionMeta: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  positionValueBlock: {
    alignItems: 'flex-end',
  },
  positionValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  positionChange: {
    fontSize: 13,
    marginTop: 4,
  },
  marketGrid: {
    gap: 16,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  marketInfo: {
    alignItems: 'flex-end',
  },
  marketValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  marketChange: {
    fontSize: 13,
    marginTop: 4,
  },
  activityStack: {
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#CBD5F5',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionsSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  quickActionsGrid: {
    gap: 14,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionContent: {
    flex: 1,
    gap: 6,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  educationGrid: {
    gap: 14,
  },
  educationCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  educationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  educationContent: {
    flex: 1,
    gap: 4,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  educationDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});
