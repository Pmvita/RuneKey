// RuneKey/src/screens/SettingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import {
  AnimatedSettingsCard,
  AnimatedSettingsItem,
  AnimatedSwitch,
  AnimatedSectionHeader,
  UniversalBackground,
} from '../components';
import { useAppStore } from '../stores/app/useAppStore';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useWallet } from '../hooks/wallet/useWallet';
import { NETWORK_CONFIGS } from '../constants';
import { SupportedNetwork } from '../types';
import { logger } from '../utils/logger';
import { useThemeColors, useIsDark } from '../utils/theme';
import { notificationService } from '../services/notifications/notificationService';
import { biometricService, BiometricType } from '../services/auth/biometricService';
import { hapticFeedback } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

const STORAGE_KEYS = {
  PUSH_NOTIFICATIONS: 'push_notifications_enabled',
  BIOMETRIC_ENABLED: 'biometric_enabled',
};

export const SettingsScreen: React.FC = () => {
  const { theme, setTheme, developerMode, setDeveloperMode, logout } = useAppStore();
  const { isConnected, currentWallet, activeNetwork, disconnectWallet } = useWalletStore();
  const { switchNetwork } = useWallet();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const systemColorScheme = useColorScheme();

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType | null>(null);
  const [isLoadingBiometric, setIsLoadingBiometric] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize notifications
      await notificationService.initialize();

      // Load saved preferences
      const savedPushNotifications = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_NOTIFICATIONS);
      if (savedPushNotifications !== null) {
        setPushNotificationsEnabled(savedPushNotifications === 'true');
      }

      const savedBiometric = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      if (savedBiometric !== null) {
        setBiometricEnabled(savedBiometric === 'true');
      }

      // Check biometric availability
      const biometricInfo = await biometricService.getBiometricType();
      setBiometricType(biometricInfo);
    };

    initializeServices();
  }, []);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SettingsScreen');
      // Start animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, [])
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const handleThemeChange = useCallback(async () => {
    hapticFeedback.selection();
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    logger.logButtonPress('Theme Toggle', `switch to ${newTheme} mode`);
    
    // Show notification
    await notificationService.scheduleLocalNotification({
      title: 'Theme Changed',
      body: `Switched to ${newTheme === 'system' ? 'system' : newTheme} theme`,
      data: { type: 'theme_change', theme: newTheme },
    });
  }, [theme, setTheme]);

  const handleNetworkSwitch = useCallback(() => {
    hapticFeedback.medium();
    const networkOptions = Object.keys(NETWORK_CONFIGS).map(network => ({
      text: NETWORK_CONFIGS[network as SupportedNetwork].name,
      onPress: async () => {
        switchNetwork(network as SupportedNetwork);
        logger.logButtonPress('Network Switch', `switch to ${network}`);
        hapticFeedback.success();
        
        // Show notification
        await notificationService.showNetworkSwitchNotification(
          NETWORK_CONFIGS[network as SupportedNetwork].name
        );
      },
    }));

    Alert.alert(
      'Switch Network',
      'Select a network to switch to:',
      networkOptions
    );
  }, [switchNetwork]);

  const handleSecurityPress = useCallback(() => {
    hapticFeedback.medium();
    logger.logButtonPress('Security', 'navigate to security settings');
    Alert.alert(
      'Security Settings',
      'Security settings including 2FA, backup phrases, and wallet encryption will be available soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleHelpPress = useCallback(() => {
    hapticFeedback.medium();
    logger.logButtonPress('Help', 'navigate to help center');
    Alert.alert(
      'Help Center',
      'Access tutorials, FAQs, and support documentation. Coming soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handlePushNotificationsToggle = useCallback(async (value: boolean) => {
    hapticFeedback.light();
    setPushNotificationsEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS, value.toString());
    
    if (value) {
      await notificationService.initialize();
      await notificationService.scheduleLocalNotification({
        title: 'Notifications Enabled',
        body: 'You will now receive alerts for transactions and price changes',
        data: { type: 'notifications_enabled' },
      });
    } else {
      await notificationService.cancelAllNotifications();
    }
    
    logger.logButtonPress('Push Notifications', value ? 'enabled' : 'disabled');
  }, []);

  const handleBiometricToggle = useCallback(async (value: boolean) => {
    hapticFeedback.light();
    
    if (value) {
      setIsLoadingBiometric(true);
      const available = await biometricService.isAvailable();
      
      if (!available) {
        Alert.alert(
          'Biometric Not Available',
          'Biometric authentication is not available on this device or not enrolled.',
          [{ text: 'OK' }]
        );
        setIsLoadingBiometric(false);
        return;
      }

      const authenticated = await biometricService.authenticate(
        'Enable biometric authentication to secure your wallet'
      );

      if (authenticated) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        hapticFeedback.success();
        
        await notificationService.scheduleLocalNotification({
          title: 'Biometric Enabled',
          body: `${biometricType?.name || 'Biometric'} authentication is now active`,
          data: { type: 'biometric_enabled' },
        });
      } else {
        hapticFeedback.error();
      }
      setIsLoadingBiometric(false);
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      hapticFeedback.light();
    }
    
    logger.logButtonPress('Biometric', value ? 'enabled' : 'disabled');
  }, [biometricType]);

  const handleDisconnectWallet = useCallback(() => {
    hapticFeedback.medium();
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => hapticFeedback.light() },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            disconnectWallet();
            hapticFeedback.success();
            logger.logButtonPress('Disconnect Wallet', 'wallet disconnected');
            
            await notificationService.showWalletDisconnectedNotification();
          },
        },
      ]
    );
  }, [disconnectWallet]);

  const handleLogout = useCallback(() => {
    hapticFeedback.medium();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will take you back to the login screen.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => hapticFeedback.light() },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Disconnect wallet first
            disconnectWallet();
            // Then logout from app
            logout();
            hapticFeedback.success();
            logger.logButtonPress('Logout', 'user logged out');
            
            await notificationService.scheduleLocalNotification({
              title: 'Logged Out',
              body: 'You have been logged out successfully',
              data: { type: 'logout' },
            });
          },
        },
      ]
    );
  }, [disconnectWallet, logout]);

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getThemeIcon = () => {
    if (theme === 'system') return 'phone-portrait';
    return theme === 'dark' ? 'moon' : 'sunny';
  };

  const getThemeText = () => {
    if (theme === 'system') {
      return `System (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})`;
    }
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <Animated.View 
            style={[
              { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
              headerAnimatedStyle
            ]}
          >
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 4,
              letterSpacing: -0.5,
            }}>
              Settings
            </Text>
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              Manage your wallet preferences
            </Text>
          </Animated.View>

          {/* Connected Wallet Section */}
          <AnimatedSettingsCard delay={100} variant="glass" style={{ marginHorizontal: 24, marginBottom: 32 }}>
            <View style={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: colors.primary,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="wallet" size={24} color={colors.textInverse} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}>
                    Connected Wallet
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontFamily: 'monospace',
                  }}>
                    {currentWallet ? truncateAddress(currentWallet.address) : 'No wallet connected'}
                  </Text>
                </View>
                {isConnected && (
                  <View style={{
                    backgroundColor: colors.success,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.textInverse,
                    }}>
                      Connected
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                }}>
                  Network: {activeNetwork}
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                }}>
                  {currentWallet ? formatUSD(parseFloat(currentWallet.balance) * 3000) : '$0'}
                </Text>
              </View>
            </View>
          </AnimatedSettingsCard>

          {/* Quick Actions Section */}
          <AnimatedSectionHeader 
            title="Quick Actions" 
            delay={200}
            style={{ paddingHorizontal: 24, marginBottom: 16 }}
          />
          <AnimatedSettingsCard delay={250} variant="glass" style={{ marginHorizontal: 24, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 24 }}>
              {/* Switch Network */}
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={handleNetworkSwitch}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.primaryLight + '20',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                }}>
                  <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  Switch Network
                </Text>
              </TouchableOpacity>

              {/* Security */}
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={handleSecurityPress}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.success + '20',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.success + '40',
                }}>
                  <Ionicons name="shield-checkmark" size={28} color={colors.success} />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  Security
                </Text>
              </TouchableOpacity>

              {/* Help */}
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={handleHelpPress}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.accent + '20',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.accent + '40',
                }}>
                  <Ionicons name="help-circle" size={28} color={colors.accent} />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  Help
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedSettingsCard>

          {/* Preferences Section */}
          <AnimatedSectionHeader 
            title="Preferences" 
            delay={400}
            style={{ paddingHorizontal: 24, marginBottom: 16 }}
          />
          <AnimatedSettingsCard delay={450} variant="glass" style={{ marginHorizontal: 24, marginBottom: 32 }}>
            {/* Theme Toggle */}
            <AnimatedSettingsItem
              key={`theme-${theme}`}
              icon={getThemeIcon()}
              title="Theme"
              subtitle={getThemeText()}
              onPress={handleThemeChange}
              rightElement={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginRight: 8,
                  }}>
                    {getThemeText()}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              }
              showArrow={false}
              delay={500}
            />

            {/* Push Notifications */}
            <AnimatedSettingsItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Get alerts for transactions and price changes"
              rightElement={
                <AnimatedSwitch
                  value={pushNotificationsEnabled}
                  onValueChange={handlePushNotificationsToggle}
                  delay={550}
                />
              }
              showArrow={false}
              delay={550}
            />

            {/* Biometric */}
            {biometricType?.available && (
              <AnimatedSettingsItem
                icon={biometricType.type === 'facial' ? 'face-recognition' : 'finger-print'}
                title={biometricType.name}
                subtitle={`Use ${biometricType.name.toLowerCase()} to unlock`}
                rightElement={
                  <AnimatedSwitch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    disabled={isLoadingBiometric}
                    delay={600}
                  />
                }
                showArrow={false}
                delay={600}
              />
            )}
          </AnimatedSettingsCard>

          {/* Developer Mode (if enabled) */}
          {developerMode && (
            <>
              <AnimatedSectionHeader 
                title="Developer" 
                delay={700}
                style={{ paddingHorizontal: 24, marginBottom: 16 }}
              />
              <AnimatedSettingsCard delay={750} variant="glass" style={{ marginHorizontal: 24, marginBottom: 32 }}>
                <AnimatedSettingsItem
                  icon="code"
                  title="Developer Mode"
                  subtitle="Advanced features for development"
                  rightElement={
                    <AnimatedSwitch
                      value={developerMode}
                      onValueChange={(value) => {
                        hapticFeedback.light();
                        setDeveloperMode(value);
                      }}
                      delay={800}
                    />
                  }
                  showArrow={false}
                  delay={800}
                />
              </AnimatedSettingsCard>
            </>
          )}

          {/* Logout Section */}
          <AnimatedSettingsCard delay={900} variant="glass" style={{ marginHorizontal: 24, marginTop: 16 }}>
            <AnimatedSettingsItem
              icon="log-out"
              title="Logout"
              subtitle="Sign out and return to login screen"
              onPress={handleLogout}
              variant="danger"
              delay={950}
            />
          </AnimatedSettingsCard>
        </ScrollView>
      </SafeAreaView>
    </UniversalBackground>
  );
};
