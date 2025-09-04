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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { logger } from '../utils/logger';
import { LiquidGlass, UniversalBackground } from '../components';

type SendScreenRouteProp = RouteProp<RootStackParamList, 'Send'>;

export const SendScreen: React.FC = () => {
  const route = useRoute<SendScreenRouteProp>();
  const navigation = useNavigation();
  const { currentWallet } = useWalletStore();
  
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState(route.params?.selectedToken || currentWallet?.tokens[0]);
  const [gasPrice, setGasPrice] = useState('0.0001');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    logger.logScreenFocus('SendScreen');
  }, []);

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
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
    }
  };

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return false;
    }

    if (!recipientAddress || recipientAddress.length < 10) {
      Alert.alert('Invalid Address', 'Please enter a valid recipient address.');
      return false;
    }

    if (!selectedToken) {
      Alert.alert('No Token Selected', 'Please select a token to send.');
      return false;
    }

    const tokenBalance = parseFloat(selectedToken.balance || '0');
    const sendAmount = parseFloat(amount);
    
    if (sendAmount > tokenBalance) {
      Alert.alert('Insufficient Balance', `You only have ${tokenBalance} ${selectedToken.symbol} available.`);
      return false;
    }

    return true;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
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

  const formatUSDValue = (value: number) => {
    if (!value || isNaN(value)) return '$0.00';
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getEstimatedFee = () => {
    const gasPriceNum = parseFloat(gasPrice);
    const estimatedGas = 21000; // Standard ETH transfer
    return (gasPriceNum * estimatedGas / 1e18).toFixed(6);
  };

  const getTotalAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    const feeNum = parseFloat(getEstimatedFee()) || 0;
    return amountNum + feeNum;
  };

  return (
    <SafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
      {/* Icy blue background overlay */}
      <View 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 p-2"
              >
                <Ionicons name="arrow-back" size={24} color="#475569" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Send
              </Text>
            </View>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-6">
              Transfer tokens to another wallet
            </Text>
          </View>

          {/* Token Selection */}
          <View className="px-6 mb-6">
            <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Select Token
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  {currentWallet?.tokens.map((token) => (
                    <TouchableOpacity
                      key={token.address}
                      onPress={() => {
                        setSelectedToken(token);
                        logger.logButtonPress('Select Token', `selected ${token.symbol}`);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        selectedToken?.address === token.address
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="w-6 h-6 rounded-full bg-gray-200 mr-2" />
                        <View>
                          <Text className="font-semibold text-slate-900 dark:text-slate-100">
                            {token.symbol}
                          </Text>
                          <Text className="text-sm text-slate-600 dark:text-slate-400">
                            {formatBalance(token.balance || '0', token.decimals)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Amount Input */}
          <View className="px-6 mb-6">
            <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Amount
              </Text>
              
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white p-4">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="flex-1 text-lg font-semibold text-slate-900"
                  style={{ fontSize: 18 }}
                />
                <Text className="text-lg font-semibold text-slate-600 ml-2">
                  {selectedToken?.symbol}
                </Text>
              </View>
              
              {selectedToken && (
                <View className="mt-2 flex-row justify-between">
                  <Text className="text-sm text-slate-600 dark:text-slate-400">
                    Available: {formatBalance(selectedToken.balance || '0', selectedToken.decimals)} {selectedToken.symbol}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setAmount(selectedToken.balance || '0');
                      logger.logButtonPress('Max Amount', `set max ${selectedToken.symbol}`);
                    }}
                  >
                    <Text className="text-sm text-blue-600 font-medium">
                      MAX
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Recipient Address */}
          <View className="px-6 mb-6">
            <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Recipient Address
              </Text>
              
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-white p-4">
                <TextInput
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder="Enter wallet address"
                  className="flex-1 text-slate-900"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowQRScanner(true);
                    logger.logButtonPress('QR Scanner', 'open QR scanner');
                  }}
                  className="ml-2 p-2"
                >
                  <Ionicons name="qr-code" size={20} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Gas Settings */}
          <View className="px-6 mb-6">
            <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Gas Settings
              </Text>
              
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-slate-600 dark:text-slate-400">
                  Gas Price (Gwei)
                </Text>
                <TextInput
                  value={gasPrice}
                  onChangeText={setGasPrice}
                  keyboardType="numeric"
                  className="text-right text-slate-900 font-medium"
                  style={{ width: 80 }}
                />
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-600 dark:text-slate-400">
                  Estimated Fee
                </Text>
                <Text className="text-slate-900 dark:text-slate-100 font-medium">
                  {getEstimatedFee()} ETH
                </Text>
              </View>
            </View>
          </View>

          {/* Transaction Summary */}
          <View className="px-6 mb-6">
            <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Transaction Summary
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400">
                    Amount
                  </Text>
                  <Text className="text-slate-900 dark:text-slate-100 font-medium">
                    {amount || '0'} {selectedToken?.symbol}
                  </Text>
                </View>
                
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400">
                    Network Fee
                  </Text>
                  <Text className="text-slate-900 dark:text-slate-100 font-medium">
                    {getEstimatedFee()} ETH
                  </Text>
                </View>
                
                <View className="border-t border-gray-200 pt-3">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">
                      Total
                    </Text>
                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">
                      {getTotalAmount().toFixed(6)} {selectedToken?.symbol}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Send Button */}
          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              className={`p-4 rounded-xl shadow-lg ${
                isLoading 
                  ? 'bg-gray-300' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
            >
              <View className="flex-row items-center justify-center">
                {isLoading ? (
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Ionicons name="send" size={20} color="white" style={{ marginRight: 8 }} />
                )}
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? 'Sending...' : 'Send Transaction'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 