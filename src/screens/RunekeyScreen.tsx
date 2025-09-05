import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
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
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { logger } from '../utils/logger';
import { 
  UniversalBackground,
  LiquidGlass,
  ParticleEffect,
  LoadingOverlay
} from '../components';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

export const RunekeyScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  // Promotional banners/announcements
  const banners = [
    {
      id: 'staking-promo',
      type: 'promotion',
      title: '🚀 New Feature: Staking Rewards',
      description: 'Earn up to 12% APY by staking your ETH. Limited time offer!',
      actionText: 'Start Staking',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: 'trending-up',
    },
    {
      id: 'partnership-announcement',
      type: 'announcement',
      title: '🎉 Partnership Announcement',
      description: 'Runekey now supports Polygon network! Lower fees, faster transactions.',
      actionText: 'Learn More',
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      icon: 'globe',
    },
    {
      id: 'security-update',
      type: 'security',
      title: '🔒 Security Update Available',
      description: 'Update to the latest version for enhanced security features.',
      actionText: 'Update Now',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: 'shield-checkmark',
    },
    {
      id: 'nft-marketplace',
      type: 'feature',
      title: '🎨 NFT Marketplace Beta',
      description: 'Buy, sell, and trade NFTs directly from your wallet. Beta access now available!',
      actionText: 'Join Beta',
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: 'image',
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

  // Load dismissed banners from storage
  useEffect(() => {
    loadDismissedBanners();
  }, []);

  const loadDismissedBanners = async () => {
    try {
      const stored = await AsyncStorage.getItem('dismissedBanners');
      if (stored) {
        setDismissedBanners(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading dismissed banners:', error);
    }
  };

  const dismissBanner = async (bannerId: string) => {
    try {
      const newDismissed = [...dismissedBanners, bannerId];
      setDismissedBanners(newDismissed);
      await AsyncStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
      logger.logButtonPress('Banner Dismissed', bannerId);
    } catch (error) {
      console.log('Error dismissing banner:', error);
    }
  };

  const handleBannerAction = (banner: any) => {
    logger.logButtonPress('Banner Action', banner.id);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 2000);
    
    // Show action-specific alert
    Alert.alert(
      banner.title,
      `This would ${banner.actionText.toLowerCase()} for ${banner.title}`,
      [{ text: 'OK' }]
    );
  };

  // Get visible banners (not dismissed)
  const visibleBanners = banners.filter(banner => !dismissedBanners.includes(banner.id));

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

  const handleFeaturePress = (feature: string) => {
    logger.logButtonPress('Feature', feature);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 2000);
  };

  const features = [
    {
      id: 'security',
      title: 'Secure & Private',
      description: 'Your keys, your crypto, your control',
      icon: 'shield-checkmark',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      id: 'speed',
      title: 'Lightning Fast',
      description: 'Instant transactions and real-time updates',
      icon: 'flash',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
    {
      id: 'multichain',
      title: 'Multi-Chain Support',
      description: 'Ethereum, Polygon, BSC and more',
      icon: 'globe',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      id: 'market',
      title: 'Live Market Data',
      description: 'Real-time prices and portfolio tracking',
      icon: 'trending-up',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
  ];

  const stats = [
    { label: 'Total Transactions', value: '1,247', icon: 'swap-horizontal' },
    { label: 'Supported Networks', value: '5', icon: 'layers' },
    { label: 'Security Score', value: '98/100', icon: 'shield-checkmark' },
    { label: 'Active Users', value: '12.5K', icon: 'people' },
  ];

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

          {/* Welcome Card */}
          <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              className="p-6"
            >
              <View style={styles.welcomeContent}>
                <Image 
                  source={require('../../assets/icon.png')}
                  style={styles.welcomeLogo}
                />
                <Text style={styles.welcomeTitle}>Welcome to Runekey</Text>
                <Text style={styles.welcomeSubtitle}>
                  Your secure digital wallet for the modern world
                </Text>
              </View>
            </LiquidGlass>
          </Animated.View>

          {/* Promotional Banners */}
          {visibleBanners.length > 0 && (
            <Animated.View style={[cardAnimatedStyle, styles.bannersContainer]}>
              <Text style={styles.sectionTitle}>Announcements & Promotions</Text>
              
              {visibleBanners.map((banner, index) => (
                <Animated.View
                  key={banner.id}
                  style={[styles.bannerCard]}
                >
                  <LiquidGlass
                    cornerRadius={20}
                    elasticity={0.15}
                    className="p-4"
                  >
                    <View style={styles.bannerContent}>
                      <View style={styles.bannerHeader}>
                        <View style={styles.bannerIconContainer}>
                          <View style={[styles.bannerIcon, { backgroundColor: banner.bgColor }]}>
                            <Ionicons name={banner.icon as any} size={20} color={banner.color} />
                          </View>
                        </View>
                        <View style={styles.bannerText}>
                          <Text style={styles.bannerTitle}>{banner.title}</Text>
                          <Text style={styles.bannerDescription}>{banner.description}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => dismissBanner(banner.id)}
                          style={styles.dismissButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => handleBannerAction(banner)}
                        style={[styles.bannerActionButton, { backgroundColor: banner.color }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bannerActionText}>{banner.actionText}</Text>
                        <Ionicons name="arrow-forward" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </LiquidGlass>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Features Section */}
          <Animated.View style={[featuresAnimatedStyle, styles.sectionContainer]}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <TouchableOpacity
                  key={feature.id}
                  onPress={() => handleFeaturePress(feature.title)}
                  activeOpacity={0.7}
                >
                  <LiquidGlass
                    cornerRadius={20}
                    elasticity={0.15}
                    className="p-4"
                    onPress={() => handleFeaturePress(feature.title)}
                  >
                    <View style={styles.featureContent}>
                      <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                        <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                      </View>
                      <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </View>
                    </View>
                  </LiquidGlass>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Stats Section */}
          <Animated.View style={[statsAnimatedStyle, styles.sectionContainer]}>
            <Text style={styles.sectionTitle}>App Statistics</Text>
            
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <LiquidGlass
                  key={stat.label}
                  cornerRadius={20}
                  elasticity={0.15}
                  className="p-4"
                >
                  <View style={styles.statContent}>
                    <View style={styles.statIcon}>
                      <Ionicons name={stat.icon as any} size={20} color="#64748b" />
                    </View>
                    <View style={styles.statText}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  </View>
                </LiquidGlass>
              ))}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[cardAnimatedStyle, styles.actionsContainer]}>
            <LiquidGlass
              cornerRadius={24}
              elasticity={0.2}
              className="p-6"
            >
              <Text style={styles.actionsTitle}>Get Started</Text>
              <Text style={styles.actionsSubtitle}>
                Explore the full potential of your digital wallet
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    logger.logButtonPress('Explore Wallet', 'navigate to wallet');
                    setShowParticles(true);
                    setTimeout(() => setShowParticles(false), 2000);
                  }}
                >
                  <Ionicons name="wallet" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Explore Wallet</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    logger.logButtonPress('Learn More', 'show tutorial');
                    setShowParticles(true);
                    setTimeout(() => setShowParticles(false), 2000);
                  }}
                >
                  <Ionicons name="book" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryButtonText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </LiquidGlass>
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
    width: 48,
    height: 48,
    marginRight: 16,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 4,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  bannersContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  bannerCard: {
    marginBottom: 12,
  },
  bannerContent: {
    gap: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerIconContainer: {
    marginRight: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  bannerActionText: {
    color: '#ffffff',
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
    color: '#1e293b',
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  statsGrid: {
    gap: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionsSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
});