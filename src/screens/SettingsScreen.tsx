import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LiquidGlass } from '../components';
import { useAppStore } from '../stores/app/useAppStore';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useWallet } from '../hooks/wallet/useWallet';
import { NETWORK_CONFIGS } from '../constants';
import { SupportedNetwork } from '../types';
import { logger } from '../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'default' | 'danger' | 'warning';
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: '#dc2626',
          titleColor: '#dc2626',
          subtitleColor: '#ef4444',
        };
      case 'warning':
        return {
          iconColor: '#f59e0b',
          titleColor: '#f59e0b',
          subtitleColor: '#fbbf24',
        };
      default:
        return {
          iconColor: '#64748b',
          titleColor: '#1e293b',
          subtitleColor: '#64748b',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
      }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={{
        width: 40,
        height: 40,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        {icon === 'wallet' ? (
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name={icon as any} size={20} color={styles.iconColor} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: styles.titleColor,
          marginBottom: 4,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: styles.subtitleColor,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View style={{ marginRight: 8 }}>
          {rightElement}
        </View>
      )}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );
};

export const SettingsScreen: React.FC = () => {
  const { theme, setTheme, developerMode, setDeveloperMode } = useAppStore();
  const { isConnected, currentWallet, activeNetwork, disconnectWallet } = useWalletStore();
  const { switchNetwork } = useWallet();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const walletCardScale = useSharedValue(0.9);
  const walletCardOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(30);
  const actionsOpacity = useSharedValue(0);
  const preferencesTranslateY = useSharedValue(30);
  const preferencesOpacity = useSharedValue(0);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SettingsScreen');
      // Start animations
      headerOpacity.value = withTiming(1, { duration: 600 });
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      
      setTimeout(() => {
        walletCardOpacity.value = withTiming(1, { duration: 600 });
        walletCardScale.value = withSpring(1, { damping: 12, stiffness: 120 });
      }, 200);

      setTimeout(() => {
        actionsOpacity.value = withTiming(1, { duration: 600 });
        actionsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 400);

      setTimeout(() => {
        preferencesOpacity.value = withTiming(1, { duration: 600 });
        preferencesTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, 600);
    }, [])
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const walletCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: walletCardOpacity.value,
    transform: [{ scale: walletCardScale.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const preferencesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: preferencesOpacity.value,
    transform: [{ translateY: preferencesTranslateY.value }],
  }));

  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    logger.logButtonPress('Theme Toggle', `switch to ${newTheme} mode`);
  };

  const handleNetworkSwitch = () => {
    Alert.alert(
      'Switch Network',
      'Select a network to switch to:',
      Object.keys(NETWORK_CONFIGS).map(network => ({
        text: NETWORK_CONFIGS[network as SupportedNetwork].name,
        onPress: () => {
          switchNetwork(network as SupportedNetwork);
          logger.logButtonPress('Network Switch', `switch to ${network}`);
        },
      }))
    );
  };

  const handleSecurityPress = () => {
    logger.logButtonPress('Security', 'navigate to security settings');
    Alert.alert('Security', 'Security settings will be available soon!');
  };

  const handleHelpPress = () => {
    logger.logButtonPress('Help', 'navigate to help center');
    Alert.alert('Help', 'Help center will be available soon!');
  };

  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectWallet();
            logger.logButtonPress('Disconnect Wallet', 'wallet disconnected');
          },
        },
      ]
    );
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Enhanced background gradient */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
      }} />

      {/* Subtle background pattern */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
        <View style={{ position: 'absolute', top: 80, left: 40, width: 120, height: 120, backgroundColor: '#3b82f6', borderRadius: 60 }} />
        <View style={{ position: 'absolute', bottom: 150, right: 60, width: 80, height: 80, backgroundColor: '#10b981', borderRadius: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Enhanced Header */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }, headerAnimatedStyle]}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: 4,
            letterSpacing: -0.5,
          }}>
            Settings
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#64748b',
            textAlign: 'center',
          }}>
            Manage your wallet preferences
          </Text>
        </Animated.View>

        {/* Enhanced Connected Wallet Section */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 32 }, walletCardAnimatedStyle]}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: '#3b82f6',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="wallet" size={24} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: 4,
                }}>
                  Connected Wallet
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}>
                  {currentWallet ? truncateAddress(currentWallet.address) : 'No wallet connected'}
                </Text>
              </View>
              <View style={{
                backgroundColor: '#22c55e',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#ffffff',
                }}>
                  Connected
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{
                fontSize: 14,
                color: '#64748b',
              }}>
                Network: {activeNetwork}
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#1e293b',
              }}>
                {currentWallet ? formatUSD(parseFloat(currentWallet.balance) * 3000) : '$0'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Quick Actions Section */}
        <Animated.View style={[{ paddingHorizontal: 24, marginBottom: 32 }, actionsAnimatedStyle]}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: 16,
          }}>
            Quick Actions
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
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
                  backgroundColor: '#eff6ff',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  shadowColor: '#3b82f6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}>
                  <Ionicons name="swap-horizontal" size={28} color="#3b82f6" />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
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
                  backgroundColor: '#f0fdf4',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  shadowColor: '#22c55e',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(34, 197, 94, 0.2)',
                }}>
                  <Ionicons name="shield-checkmark" size={28} color="#22c55e" />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
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
                  backgroundColor: '#faf5ff',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  shadowColor: '#a855f7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.2)',
                }}>
                  <Ionicons name="help-circle" size={28} color="#a855f7" />
                </View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                }}>
                  Help
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Preferences Section */}
        <Animated.View style={[{ paddingHorizontal: 24 }, preferencesAnimatedStyle]}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: 16,
          }}>
            Preferences
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
            {/* Dark Mode */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(148, 163, 184, 0.2)',
            }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#f1f5f9',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="moon" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: 4,
                }}>
                  Dark Mode
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                }}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={handleThemeChange}
                trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Push Notifications */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(148, 163, 184, 0.2)',
            }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#f1f5f9',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="notifications" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: 4,
                }}>
                  Push Notifications
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                }}>
                  Get alerts for transactions and price changes
                </Text>
              </View>
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={setPushNotificationsEnabled}
                trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Biometric */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 20,
            }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#f1f5f9',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="finger-print" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: 4,
                }}>
                  Biometric
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#64748b',
                }}>
                  Use fingerprint or face ID to unlock
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};