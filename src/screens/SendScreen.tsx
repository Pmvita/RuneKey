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

type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

const { width: screenWidth } = Dimensions.get('window');

export const SendScreen: React.FC = () => {
  const route = useRoute<SendScreenRouteProp>();
  const navigation = useNavigation();
  const { currentWallet } = useWalletStore();
  
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState(route.params?.selectedToken || currentWallet?.tokens[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logger.logScreenFocus('SendScreen');
    
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

  const handleSend = async () => {
    if (!validateForm()) return;

    // Animate button press and show particles
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsLoading(true);
    setShowParticles(true);
    logger.logButtonPress('Send Transaction', 'initiate send transaction');

    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Transaction Sent',
        `Successfully sent ${amount} ${selectedToken?.symbol} to ${recipientAddress}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
    } finally {
      setIsLoading(false);
      setShowParticles(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!recipientAddress || recipientAddress.length < 10) {
      newErrors.recipient = 'Please enter a valid recipient address';
    }

    if (!selectedToken) {
      newErrors.token = 'Please select a token to send';
    }

    if (selectedToken) {
      const tokenBalance = parseFloat(selectedToken.balance || '0');
      const sendAmount = parseFloat(amount);
      
      if (sendAmount > tokenBalance) {
        newErrors.amount = `Insufficient balance. Available: ${tokenBalance} ${selectedToken.symbol}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    logger.logButtonPress('QR Scanner', 'open QR scanner');
  };

  const closeQRScanner = () => {
    setShowQRScanner(false);
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

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={isLoading}
          message="Sending Transaction..."
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
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Send</Text>
                  <Text style={styles.subtitle}>Transfer crypto to another wallet</Text>
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
                  <Text style={styles.cardTitle}>From</Text>
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
                        {selectedToken?.name || 'Choose a token to send'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </LiquidGlass>
            </Animated.View>

            {/* Amount Input */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>Amount</Text>
                
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
                      <View style={{ width: 12 }} />
                      <TouchableOpacity
                        onPress={() => setAmount(selectedToken?.balance || '0')}
                        style={styles.maxButton}
                      >
                        <Text style={styles.maxButtonText}>MAX</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeText}>≈ $0.00 USD</Text>
                  <Text style={styles.feeText}>Fee: ~$0.00</Text>
                </View>
                
                {errors.amount && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  </View>
                )}
              </LiquidGlass>
            </Animated.View>

            {/* Recipient Address */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>To</Text>
                
                <View style={styles.addressInputContainer}>
                  <View style={styles.addressInputRow}>
                    <TextInput
                      value={recipientAddress}
                      onChangeText={setRecipientAddress}
                      placeholder="Enter wallet address"
                      placeholderTextColor="#94a3b8"
                      multiline
                      style={styles.addressInput}
                    />
                    <TouchableOpacity
                      onPress={openQRScanner}
                      style={styles.qrButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="qr-code-outline" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {recipientAddress && (
                  <View style={styles.successContainer}>
                    <View style={styles.successRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      <Text style={styles.successText}>Valid address format</Text>
                    </View>
                  </View>
                )}
                
                {errors.recipient && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.recipient}</Text>
                  </View>
                )}
              </LiquidGlass>
            </Animated.View>

            {/* Transaction Summary */}
            <Animated.View style={[cardAnimatedStyle, styles.cardContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <Text style={styles.cardTitle}>Transaction Summary</Text>
                
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={styles.summaryValue}>
                      {amount || '0'} {selectedToken?.symbol}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Network Fee</Text>
                    <Text style={styles.summaryValue}>~$0.00</Text>
                  </View>
                  
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {amount || '0'} {selectedToken?.symbol}
                    </Text>
                  </View>
                </View>
              </LiquidGlass>
            </Animated.View>

            {/* Safety Warning */}
            <Animated.View style={[cardAnimatedStyle, styles.warningContainer]}>
              <LiquidGlass
                cornerRadius={20}
                elasticity={0.2}
                className="p-4"
              >
                <View style={styles.warningRow}>
                  <Ionicons name="warning" size={24} color="#f59e0b" style={{ marginTop: 4 }} />
                  <View style={styles.warningText}>
                    <Text style={styles.warningTitle}>Double-check the recipient address</Text>
                    <Text style={styles.warningSubtitle}>
                      Transactions cannot be reversed. Make sure the address is correct.
                    </Text>
                  </View>
                </View>
              </LiquidGlass>
            </Animated.View>

            {/* Send Button */}
            <Animated.View style={[cardAnimatedStyle, buttonAnimatedStyle, styles.buttonContainer]}>
              <TouchableOpacity
                onPress={handleSend}
                disabled={isLoading || !amount || !recipientAddress}
                style={[
                  styles.sendButton,
                  (isLoading || !amount || !recipientAddress) && styles.sendButtonDisabled
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {isLoading ? (
                    <>
                      <View style={styles.loadingSpinner} />
                      <Text style={styles.buttonText}>Sending...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={24} color="white" style={{ marginRight: 12 }} />
                      <Text style={styles.buttonText}>Send Transaction</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* QR Scanner Modal */}
        <Modal
          visible={showQRScanner}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <UniversalBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={closeQRScanner}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Scan QR Code</Text>
                  <View style={{ width: 40 }} />
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.qrScannerPlaceholder}>
                    <Ionicons name="qr-code-outline" size={100} color="#3b82f6" />
                    <Text style={styles.qrPlaceholderText}>
                      QR Scanner not available{'\n'}
                      Install expo-barcode-scanner to enable QR scanning
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Simulate QR scan for demo
                        setRecipientAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
                        setShowQRScanner(false);
                      }}
                      style={styles.demoButton}
                    >
                      <Text style={styles.demoButtonText}>Use Demo Address</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.modalFooter}>
                  <Text style={styles.modalFooterText}>
                    Position the QR code within the frame to scan
                  </Text>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  balanceText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#111827',
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
    color: '#FFFFFF',
  },
  tokenName: {
    fontSize: 14,
    color: '#94A3B8',
  },
  amountInputContainer: {
    backgroundColor: '#111827',
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
    color: '#FFFFFF',
  },
  maxButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  maxButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  addressInputContainer: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  qrButton: {
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
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  summaryLabel: {
    color: '#94A3B8',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  totalRow: {
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    marginLeft: 16,
    flex: 1,
  },
  warningTitle: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  warningSubtitle: {
    color: '#d97706',
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sendButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrScannerPlaceholder: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  qrPlaceholderText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    fontSize: 16,
  },
  demoButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
  },
  demoButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalFooter: {
    padding: 24,
  },
  modalFooterText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 16,
  },
});