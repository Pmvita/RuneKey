import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
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
import { RootStackParamList } from '../types';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { logger } from '../utils/logger';
import { 
  UniversalBackground,
  LoadingOverlay,
  ParticleEffect,
  LiquidGlass,
  Card
} from '../components';

type ReceiveScreenRouteProp = RouteProp<RootStackParamList, 'Receive'>;

const { width: screenWidth } = Dimensions.get('window');

export const ReceiveScreen: React.FC = () => {
  const route = useRoute<ReceiveScreenRouteProp>();
  const navigation = useNavigation();
  const { currentWallet } = useWalletStore();
  
  const [selectedToken, setSelectedToken] = useState(route.params?.selectedToken || currentWallet?.tokens[0]);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logger.logScreenFocus('ReceiveScreen');
    
    // Animate cards on mount
    cardOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCopyAddress = async () => {
    // Animate button press and show particles
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsLoading(true);
    setShowParticles(true);
    logger.logButtonPress('Copy Address', 'copy wallet address');

    try {
      // Simulate copying to clipboard
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Address Copied',
        'Wallet address has been copied to clipboard',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address. Please try again.');
    } finally {
      setIsLoading(false);
      setShowParticles(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const generateWalletAddress = () => {
    // Generate a demo wallet address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const walletAddress = generateWalletAddress();

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={isLoading}
          message="Copying Address..."
          spinnerSize={60}
          spinnerColor="#3B82F6"
        />
        
        {/* Particle Effects */}
        <ParticleEffect 
          type="confetti" 
          active={showParticles} 
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Header */}
            <Animated.View style={[cardAnimatedStyle, styles.headerContainer]}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Receive</Text>
                  <Text style={styles.subtitle}>Receive crypto to your wallet</Text>
                </View>
              </View>
            </Animated.View>

            {/* Token Selection */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Receive</Text>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceText}>
                      Balance: {formatBalance(selectedToken?.balance || '0', selectedToken?.decimals || 18)} {selectedToken?.symbol}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.tokenSelector}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenInfo}>
                    <View style={styles.tokenIcon}>
                      <Text style={styles.tokenIconText}>
                        {selectedToken?.symbol?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.tokenSymbol}>
                        {selectedToken?.symbol || 'Select Token'}
                      </Text>
                      <Text style={styles.tokenName}>
                        {selectedToken?.name || 'Choose a token to receive'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={24} color="#64748b" />
                </TouchableOpacity>
              </LiquidGlass>
            </Animated.View>

            {/* Amount Input (Optional) */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>Amount (Optional)</Text>
                
                <View style={styles.amountInputContainer}>
                  <View style={styles.amountInputRow}>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                      style={styles.amountInput}
                    />
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenSymbol}>{selectedToken?.symbol}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeText}>≈ $0.00 USD</Text>
                  <Text style={styles.feeText}>Network: Ethereum</Text>
                </View>
              </LiquidGlass>
            </Animated.View>

            {/* Wallet Address */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>Your Wallet Address</Text>
                
                <View style={styles.addressContainer}>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressText} numberOfLines={3}>
                      {walletAddress}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCopyAddress}
                      style={styles.copyButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={24} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.successContainer}>
                  <View style={styles.successRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text style={styles.successText}>Valid wallet address</Text>
                  </View>
                </View>
              </LiquidGlass>
            </Animated.View>

            {/* QR Code Section */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>QR Code</Text>
                
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCodePlaceholder}>
                    <Ionicons name="qr-code-outline" size={120} color="#3b82f6" />
                    <Text style={styles.qrCodeText}>
                      QR Code for{'\n'}
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowQRCode(true)}
                  style={styles.qrButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="expand-outline" size={20} color="#ffffff" />
                  <Text style={styles.qrButtonText}>View Full QR Code</Text>
                </TouchableOpacity>
              </LiquidGlass>
            </Animated.View>

            {/* Instructions */}
            <Animated.View style={[cardAnimatedStyle, styles.instructionsContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <View style={styles.instructionsRow}>
                  <Ionicons name="information-circle" size={24} color="#3b82f6" style={{ marginTop: 4 }} />
                  <View style={styles.instructionsText}>
                    <Text style={styles.instructionsTitle}>How to receive crypto</Text>
                    <Text style={styles.instructionsSubtitle}>
                      1. Share your wallet address or QR code{'\n'}
                      2. Sender enters the amount and sends{'\n'}
                      3. Funds will appear in your wallet
                    </Text>
                  </View>
                </View>
              </LiquidGlass>
            </Animated.View>

            {/* Copy Address Button */}
            <Animated.View style={[cardAnimatedStyle, buttonAnimatedStyle, styles.buttonContainer]}>
              <TouchableOpacity
                onPress={handleCopyAddress}
                disabled={isLoading}
                style={styles.copyAddressButton}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {isLoading ? (
                    <>
                      <View style={styles.loadingSpinner} />
                      <Text style={styles.buttonText}>Copying...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="copy" size={24} color="white" style={{ marginRight: 12 }} />
                      <Text style={styles.buttonText}>Copy Address</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* QR Code Modal */}
        <Modal
          visible={showQRCode}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <UniversalBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowQRCode(false)}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#1e293b" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>QR Code</Text>
                  <View style={{ width: 40 }} />
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.fullQRCodeContainer}>
                    <View style={styles.fullQRCode}>
                      <Ionicons name="qr-code-outline" size={200} color="#3b82f6" />
                      <Text style={styles.fullQRCodeText}>
                        {walletAddress}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={handleCopyAddress}
                    style={styles.modalCopyButton}
                  >
                    <Text style={styles.modalCopyButtonText}>Copy Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </UniversalBackground>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  balanceContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  balanceText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f97316',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  tokenSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tokenName: {
    fontSize: 14,
    color: '#64748b',
  },
  amountInputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeText: {
    fontSize: 14,
    color: '#64748b',
  },
  addressContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  successContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    color: '#22c55e',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  qrCodeText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  qrButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  instructionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsText: {
    marginLeft: 16,
    flex: 1,
  },
  instructionsTitle: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  instructionsSubtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  copyAddressButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    borderRadius: 12,
    marginRight: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullQRCodeContainer: {
    alignItems: 'center',
  },
  fullQRCode: {
    width: 300,
    height: 300,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  fullQRCodeText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingHorizontal: 16,
  },
  modalFooter: {
    padding: 24,
  },
  modalCopyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCopyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
