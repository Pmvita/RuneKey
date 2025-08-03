import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppStore } from '../stores/app/useAppStore';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useWallet } from '../hooks/wallet/useWallet';
import { NETWORK_CONFIGS } from '../constants';
import { SupportedNetwork } from '../types';
import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledSafeAreaView = styled(SafeAreaView);

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
          titleColor: 'text-red-600',
          subtitleColor: 'text-red-500',
        };
      case 'warning':
        return {
          iconColor: '#f59e0b',
          titleColor: 'text-amber-600',
          subtitleColor: 'text-amber-500',
        };
      default:
        return {
          iconColor: '#6b7280',
          titleColor: 'text-slate-900',
          subtitleColor: 'text-slate-600',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <StyledTouchableOpacity
      className="flex-row items-center py-4 px-6 border-b border-gray-200"
      onPress={onPress}
      disabled={!onPress}
    >
      <StyledView className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full items-center justify-center mr-4 shadow-sm">
        {icon === 'wallet' ? (
          <StyledImage
            source={require('../../assets/icon.png')}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name={icon as any} size={20} color={styles.iconColor} />
        )}
      </StyledView>
      <StyledView className="flex-1">
        <StyledText className={`text-base font-semibold ${styles.titleColor}`}>
          {title}
        </StyledText>
        {subtitle && (
          <StyledText className={`text-sm ${styles.subtitleColor} mt-1`}>
            {subtitle}
          </StyledText>
        )}
      </StyledView>
      {rightElement && (
        <StyledView className="mr-2">
          {rightElement}
        </StyledView>
      )}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      )}
    </StyledTouchableOpacity>
  );
};

export const SettingsScreen: React.FC = () => {
  const { theme, setTheme, developerMode, setDeveloperMode } = useAppStore();
  const { disconnectWallet, currentWallet } = useWalletStore();
  const { isConnected, activeNetwork, disconnect, changeNetwork } = useWallet();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SettingsScreen');
    }, [])
  );

  const handleLogout = () => {
    logger.logButtonPress('Logout', 'show logout confirmation dialog');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to login again to access your wallet.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logger.logButtonPress('Logout Confirm', 'disconnect wallet and logout');
            disconnectWallet();
            // This will trigger the app to show the onboarding/login flow
          },
        },
      ]
    );
  };

  const handleExportWallet = () => {
    Alert.alert(
      'Export Wallet',
      'This will export your wallet data. Keep it secure and never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          Alert.alert('Export', 'Wallet export functionality will be available soon!');
        }},
      ]
    );
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'This action cannot be undone. All your wallet data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Delete', 'Wallet deletion functionality will be available soon!');
        }},
      ]
    );
  };

  // Load mock wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (isConnected && currentWallet) {
        setLoadingData(true);
        try {
          const mockData = require('../../mockData/api/dev-wallet.json');
          setWalletData(mockData.wallet);
          logger.logButtonPress('SettingsScreen', 'load mock wallet data');
        } catch (error) {
          logger.logError('SettingsScreen', 'Failed to load wallet data');
          console.error('Failed to load wallet data:', error);
        } finally {
          setLoadingData(false);
        }
      }
    };

    loadWalletData();
  }, [isConnected, currentWallet]);

  // Helper functions
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleNetworkChange = (network: SupportedNetwork) => {
    Alert.alert(
      'Switch Network',
      `Switch to ${NETWORK_CONFIGS[network].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: () => changeNetwork(network)
        },
      ]
    );
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet? Make sure you have your private key or mnemonic phrase saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: disconnect
        },
      ]
    );
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(93,138,168)',
        }}
      />
      
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6">
          <StyledText className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Settings
          </StyledText>
          <StyledText className="text-slate-600 text-center">
            Manage your wallet preferences
          </StyledText>
        </StyledView>

        {/* Wallet Info */}
        {currentWallet && (
          <StyledView className="mx-6 mb-6">
            <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row items-center mb-4">
                <StyledView className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="wallet" size={24} color="#3b82f6" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="text-lg font-semibold text-slate-900">
                    Connected Wallet
                  </StyledText>
                  <StyledText className="text-sm text-slate-600">
                    {formatWalletAddress(currentWallet.address)}
                  </StyledText>
                </StyledView>
                <StyledView className="bg-green-100 border border-green-200 px-3 py-1 rounded-full">
                  <StyledText className="text-xs text-green-700 font-medium">
                    Connected
                  </StyledText>
                </StyledView>
              </StyledView>
              
              <StyledView className="flex-row items-center justify-between">
                <StyledText className="text-sm text-slate-600">
                  Network: {currentWallet.network}
                </StyledText>
                <StyledText className="text-sm text-slate-600">
                  {formatUSD(walletData?.totalValue || 0)}
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        )}

        {/* Quick Actions */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <StyledView className="flex-row justify-between">
              <StyledTouchableOpacity className="items-center flex-1">
                <StyledView className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full items-center justify-center mb-2">
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </StyledView>
                <StyledText className="text-xs text-slate-600 font-medium">Switch Network</StyledText>
              </StyledTouchableOpacity>
              
              <StyledTouchableOpacity className="items-center flex-1">
                <StyledView className="w-12 h-12 bg-green-100 border border-green-200 rounded-full items-center justify-center mb-2">
                  <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                </StyledView>
                <StyledText className="text-xs text-slate-600 font-medium">Security</StyledText>
              </StyledTouchableOpacity>
              
              <StyledTouchableOpacity className="items-center flex-1">
                <StyledView className="w-12 h-12 bg-purple-100 border border-purple-200 rounded-full items-center justify-center mb-2">
                  <Ionicons name="help-circle" size={24} color="#9333ea" />
                </StyledView>
                <StyledText className="text-xs text-slate-600 font-medium">Help</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Preferences */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Preferences
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <SettingsItem
              icon="moon"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={
                <Switch
                  value={theme === 'dark'}
                  onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
                  trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                  thumbColor={theme === 'dark' ? '#ffffff' : '#ffffff'}
                />
              }
              showArrow={false}
            />

            <SettingsItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Get alerts for transactions and price changes"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                  thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
                />
              }
              showArrow={false}
            />

            <SettingsItem
              icon="finger-print"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face ID to unlock"
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                  thumbColor={biometricEnabled ? '#ffffff' : '#ffffff'}
                />
              }
              showArrow={false}
            />

            <SettingsItem
              icon="code-slash"
              title="Developer Mode"
              subtitle="Enable advanced features for developers"
              rightElement={
                <Switch
                  value={developerMode}
                  onValueChange={setDeveloperMode}
                  trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                  thumbColor={developerMode ? '#ffffff' : '#ffffff'}
                />
              }
              showArrow={false}
            />
          </StyledView>
        </StyledView>

        {/* Security */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Security
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <SettingsItem
              icon="shield-checkmark"
              title="Security Settings"
              subtitle="Manage wallet security and permissions"
              onPress={() => Alert.alert('Security', 'Security settings will be available soon!')}
            />

            <SettingsItem
              icon="key"
              title="Change Password"
              subtitle="Update your wallet password"
              onPress={() => Alert.alert('Password', 'Password change will be available soon!')}
            />

            <SettingsItem
              icon="download"
              title="Export Wallet"
              subtitle="Backup your wallet data"
              onPress={handleExportWallet}
            />
          </StyledView>
        </StyledView>

        {/* Support */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Support
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <SettingsItem
              icon="help-circle"
              title="Help & FAQ"
              subtitle="Get help and find answers"
              onPress={() => Alert.alert('Help', 'Help section will be available soon!')}
            />

            <SettingsItem
              icon="mail"
              title="Contact Support"
              subtitle="Get in touch with our team"
              onPress={() => Alert.alert('Contact', 'Contact support will be available soon!')}
            />

            <SettingsItem
              icon="document-text"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => Alert.alert('Terms', 'Terms of service will be available soon!')}
            />

            <SettingsItem
              icon="lock-closed"
              title="Privacy Policy"
              subtitle="Learn about our privacy practices"
              onPress={() => Alert.alert('Privacy', 'Privacy policy will be available soon!')}
            />
          </StyledView>
        </StyledView>

        {/* Networks */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Networks
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            {Object.entries(NETWORK_CONFIGS).map(([networkId, config]) => (
              <StyledTouchableOpacity
                key={networkId}
                className={`p-4 border-b border-gray-200 ${
                  activeNetwork === networkId ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onPress={() => handleNetworkChange(networkId as SupportedNetwork)}
              >
                <StyledView className="flex-row items-center justify-between">
                  <StyledView className="flex-row items-center">
                    <StyledText className="text-2xl mr-3">
                      {config.icon}
                    </StyledText>
                    <StyledView>
                      <StyledText className="font-medium text-slate-900">
                        {config.name}
                      </StyledText>
                      <StyledText className="text-sm text-slate-600">
                        {config.symbol}
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  
                  {activeNetwork === networkId && (
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                  )}
                </StyledView>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        </StyledView>

        {/* Danger Zone */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </StyledText>
          <StyledView className="p-6 border border-red-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
            <SettingsItem
              icon="trash"
              title="Delete Wallet"
              subtitle="Permanently delete your wallet and all data"
              onPress={handleDeleteWallet}
              variant="danger"
            />
          </StyledView>
        </StyledView>

        {/* Debug Info */}
        {__DEV__ && (
          <StyledView className="mx-6 mb-6">
            <StyledText className="text-lg font-semibold text-slate-900 mb-4">
              Debug Info
            </StyledText>
            <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="space-y-2">
                <StyledText className="text-sm text-slate-600">
                  isConnected: {isConnected ? 'true' : 'false'}
                </StyledText>
                <StyledText className="text-sm text-slate-600">
                  currentWallet: {currentWallet ? currentWallet.id : 'null'}
                </StyledText>
                <StyledText className="text-sm text-slate-600">
                  walletData: {walletData ? 'loaded' : 'not loaded'}
                </StyledText>
                <StyledText className="text-sm text-slate-600">
                  loadingData: {loadingData ? 'true' : 'false'}
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        )}

        {/* Wallet Actions */}
        <StyledView className="mx-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Wallet Actions
          </StyledText>
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <StyledView className="space-y-3">
              <Button
                title="Export Private Key"
                onPress={() => {
                  logger.logButtonPress('Export Private Key', 'show security warning');
                  Alert.alert(
                    'Security Warning',
                    'Never share your private key with anyone. Anyone with your private key can access your funds.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'I Understand', onPress: () => {
                        logger.logButtonPress('Export Private Key', 'confirm export');
                        Alert.alert('Feature Coming Soon', 'Private key export will be available in a future update');
                      }}
                    ]
                  );
                }}
                variant="outline"
                fullWidth
              />
              
              <Button
                title="View All Transactions"
                onPress={() => {
                  logger.logButtonPress('View All Transactions', 'navigate to transaction history');
                  Alert.alert('Feature Coming Soon', 'Transaction history screen will be available in a future update');
                }}
                variant="secondary"
                fullWidth
              />
              
              <Button
                title="Disconnect Wallet"
                onPress={handleDisconnect}
                variant="danger"
                fullWidth
              />
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Logout Button */}
        <StyledView className="px-6 mb-8">
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            fullWidth
          />
        </StyledView>

        {/* App Version */}
        <StyledView className="items-center pb-6">
          <StyledText className="text-sm text-slate-500">
            RuneKey v1.0.0
          </StyledText>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};