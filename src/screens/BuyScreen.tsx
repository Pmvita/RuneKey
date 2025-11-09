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

type BuyScreenRouteProp = RouteProp<RootStackParamList, 'Buy'>;

const { width: screenWidth } = Dimensions.get('window');

export const BuyScreen: React.FC = () => {
  const route = useRoute<BuyScreenRouteProp>();
  const navigation = useNavigation();
  const { currentWallet } = useWalletStore();
  
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(currentWallet?.tokens[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logger.logScreenFocus('BuyScreen');
    
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

  const handleBuy = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setShowParticles(true);

    try {
      // Simulate buy transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Purchase Successful',
        `Successfully purchased ${amount} ${selectedToken?.symbol}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowParticles(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      setShowParticles(false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!selectedToken) {
      newErrors.token = 'Please select a token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={isLoading}
          message="Processing Purchase..."
          spinnerSize={80}
          spinnerColor="#3B82F6"
        />
        
        {/* Particle Effects */}
        <ParticleEffect 
          type="confetti" 
          active={showParticles} 
          onComplete={() => setShowParticles(false)}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buy Crypto</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input Card */}
          <Animated.View style={[{ paddingHorizontal: 24, marginTop: 24 }, cardAnimatedStyle]}>
            <Card style={styles.inputCard}>
              <Text style={styles.cardTitle}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </Card>
          </Animated.View>

          {/* Token Selection Card */}
          <Animated.View style={[{ paddingHorizontal: 24, marginTop: 16 }, cardAnimatedStyle]}>
            <Card style={styles.inputCard}>
              <Text style={styles.cardTitle}>Buy</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => setShowTokenModal(true)}
              >
                <View style={styles.tokenInfo}>
                  <View style={styles.tokenIcon}>
                    <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.tokenDetails}>
                    <Text style={styles.tokenName}>
                      {selectedToken?.name || 'Select Token'}
                    </Text>
                    <Text style={styles.tokenSymbol}>
                      {selectedToken?.symbol || ''}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
              {errors.token && (
                <Text style={styles.errorText}>{errors.token}</Text>
              )}
            </Card>
          </Animated.View>

          {/* Payment Method Card */}
          <Animated.View style={[{ paddingHorizontal: 24, marginTop: 16 }, cardAnimatedStyle]}>
            <Card style={styles.inputCard}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <View style={styles.paymentMethod}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="card" size={24} color="#3b82f6" />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentName}>Credit/Debit Card</Text>
                  <Text style={styles.paymentInfo}>Visa •••• 4242</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </Card>
          </Animated.View>

          {/* Summary Card */}
          <Animated.View style={[{ paddingHorizontal: 24, marginTop: 16 }, cardAnimatedStyle]}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Purchase Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>${amount || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Token</Text>
                <Text style={styles.summaryValue}>{selectedToken?.symbol || 'N/A'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee</Text>
                <Text style={styles.summaryValue}>$2.99</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  ${amount ? (parseFloat(amount) + 2.99).toFixed(2) : '2.99'}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Buy Button */}
          <Animated.View style={[{ paddingHorizontal: 24, marginTop: 32, marginBottom: 32 }, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={[
                styles.buyButton,
                (!amount || parseFloat(amount) <= 0) && styles.buyButtonDisabled
              ]}
              onPress={() => {
                handleButtonPress();
                handleBuy();
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              <Text style={styles.buyButtonText}>
                Buy {selectedToken?.symbol || 'Crypto'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Token Selection Modal */}
        <Modal
          visible={showTokenModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTokenModal(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Token</Text>
              <View style={styles.modalSpacer} />
            </View>
            
            <ScrollView style={{ flex: 1 }}>
              {currentWallet?.tokens?.map((token: any) => (
                <TouchableOpacity
                  key={token.address}
                  style={styles.tokenOption}
                  onPress={() => {
                    setSelectedToken(token);
                    setShowTokenModal(false);
                  }}
                >
                  <View style={styles.tokenIcon}>
                    <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.tokenDetails}>
                    <Text style={styles.tokenName}>{token.name}</Text>
                    <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  </View>
                  <Text style={styles.tokenBalance}>
                    {token.balance} {token.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  inputCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenSymbol: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentInfo: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  summaryCard: {
    padding: 20,
    backgroundColor: '#000000',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSpacer: {
    width: 40,
  },
  tokenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tokenBalance: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
