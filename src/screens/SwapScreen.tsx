import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, Alert, ScrollView, TextInput, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing,
  withSequence
} from 'react-native-reanimated';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import { useSwap } from '../hooks/swap/useSwap';
import { usePrices } from '../hooks/token/usePrices';
import { walletService } from '../services/blockchain/walletService';
import { priceService, CoinInfo } from '../services/api/priceService';
import { Token, SwapParams, SwapQuote } from '../types';
import { logger } from '../utils/logger';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { COMMON_TOKENS } from '../constants';
import { LiquidGlass, UniversalBackground } from '../components';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export const SwapScreen: React.FC = () => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSelectionType, setTokenSelectionType] = useState<'input' | 'output'>('input');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [cryptoCoins, setCryptoCoins] = useState<CoinInfo[]>([]);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [rateTimer, setRateTimer] = useState(60);
  const [showSettings, setShowSettings] = useState(false);

  const { currentWallet, activeNetwork, isConnected } = useWalletStore();
  const { connectDevWallet } = useDevWallet();
  const { calculateUSDValue } = usePrices();
  const navigation = useNavigation<any>();
  
  const {
    isLoading,
    currentQuote,
    error,
    getQuote,
    executeSwap,
    validateSwap,
    getPriceImpactLevel,
    clearError,
  } = useSwap();

  // Animation values
  const swapButtonScale = useSharedValue(1);
  const inputCardOpacity = useSharedValue(0);
  const outputCardOpacity = useSharedValue(0);
  const settingsOpacity = useSharedValue(0);

  // Animated styles
  const swapButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swapButtonScale.value }],
  }));

  const inputCardStyle = useAnimatedStyle(() => ({
    opacity: inputCardOpacity.value,
    transform: [{ translateY: withSpring(inputCardOpacity.value * 20) }],
  }));

  const outputCardStyle = useAnimatedStyle(() => ({
    opacity: outputCardOpacity.value,
    transform: [{ translateY: withSpring(outputCardOpacity.value * 20) }],
  }));

  const settingsStyle = useAnimatedStyle(() => ({
    opacity: settingsOpacity.value,
  }));

  // Define getAvailableTokens function before it's used
  const getAvailableTokens = (): Token[] => {
    if (!currentWallet) return [];

    const commonTokens = walletService.getCommonTokens(activeNetwork);
    const walletTokens = currentWallet.tokens;

    // Create native token object
    const nativeToken: Token = {
      address: activeNetwork === 'solana' 
        ? 'So11111111111111111111111111111111111111112'
        : '0x0000000000000000000000000000000000000000',
      symbol: activeNetwork === 'solana' ? 'SOL' : 'ETH',
      name: activeNetwork === 'solana' ? 'Solana' : 'Ethereum',
      decimals: activeNetwork === 'solana' ? 9 : 18,
      balance: currentWallet.balance,
    };

    // Combine all tokens and remove duplicates
    const allTokens = [nativeToken, ...commonTokens, ...walletTokens];
    const uniqueTokens = allTokens.filter((token, index, self) => 
      index === self.findIndex(t => t.address === token.address)
    );

    return uniqueTokens;
  };

  // Auto-connect developer wallet in development mode
  useEffect(() => {
    if (!currentWallet) {
      connectDevWallet();
    }
  }, [currentWallet, connectDevWallet]);

  // Fetch crypto tokens from API
  useEffect(() => {
    const fetchCryptoTokens = async () => {
      setIsLoadingTokens(true);
      try {
        // Fetch top 100 coins from CoinGecko
        const result = await priceService.fetchTopCoins(100, 1);
        if (result.success) {
          setCryptoCoins(result.data);
          
          // Convert CoinInfo to Token format
          const tokensFromAPI: Token[] = result.data.map(coin => ({
            address: coin.id, // Use coin ID as address for API tokens
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            decimals: 18, // Default decimals
            balance: '0', // No balance for API tokens
            logoURI: coin.image,
            currentPrice: coin.current_price,
            priceChange24h: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
          }));
          
          // Combine with wallet tokens and common tokens
          const walletTokens = getAvailableTokens();
          const commonTokens = COMMON_TOKENS[activeNetwork as keyof typeof COMMON_TOKENS] || [];
          
          // Fallback tokens for development
          const fallbackTokens: Token[] = [
            {
              address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
              symbol: 'BTC',
              name: 'Bitcoin',
              decimals: 8,
              balance: '0',
              logoURI: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
              currentPrice: 51200,
              priceChange24h: 2.4,
              marketCap: 1000000000000,
            },
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
              balance: '0',
              logoURI: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
              currentPrice: 3200,
              priceChange24h: 1.8,
              marketCap: 400000000000,
            },
            {
              address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              balance: '0',
              logoURI: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
              currentPrice: 1.00,
              priceChange24h: 0.00,
              marketCap: 25000000000,
            },
            {
              address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              symbol: 'USDT',
              name: 'Tether USD',
              decimals: 6,
              balance: '0',
              logoURI: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
              currentPrice: 1.00,
              priceChange24h: 0.00,
              marketCap: 80000000000,
            },
            {
              address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
              symbol: 'BNB',
              name: 'BNB',
              decimals: 18,
              balance: '0',
              logoURI: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
              currentPrice: 312.45,
              priceChange24h: 0.79,
              marketCap: 48123456789,
            },
          ];
          
          const allTokensCombined = [
            ...walletTokens,
            ...commonTokens,
            ...fallbackTokens
          ];
          
          const uniqueTokens = allTokensCombined.filter((token, index, self) => 
            index === self.findIndex(t => t.symbol === token.symbol)
          );
          
          setAllTokens(uniqueTokens);
        }
      } catch (error) {
        console.error('Failed to fetch crypto tokens:', error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchCryptoTokens();
  }, [activeNetwork]);

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SwapScreen');
      
      // Animate cards on focus
      inputCardOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      outputCardOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    }, [])
  );

  // Handle settings toggle
  useEffect(() => {
    if (showSettings) {
      settingsOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      settingsOpacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [showSettings]);

  // Filter tokens based on search query
  const filteredTokens = allTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock selected tokens for development
  const [selectedInputToken, setSelectedInputToken] = useState<Token | null>({
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '1250',
  });
  const [selectedOutputToken, setSelectedOutputToken] = useState<Token | null>({
    address: '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '5000000.00',
  });

  // Mock quote for development
  const mockQuote = {
    inputAmount: '1.0',
    outputAmount: '2650.45',
    exchangeRate: '2650.45',
    priceImpact: 0.12,
    gasEstimate: '0.005',
    gasPrice: '20',
    feeUSD: '0.10',
  };

  // Calculate USD values
  const inputUSDValue = inputAmount && selectedInputToken?.currentPrice 
    ? parseFloat(inputAmount) * selectedInputToken.currentPrice 
    : 0;
  
  const outputUSDValue = outputAmount && selectedOutputToken?.currentPrice 
    ? parseFloat(outputAmount) * selectedOutputToken.currentPrice 
    : 0;

  const handleTokenSelect = (type: 'input' | 'output') => {
    logger.logButtonPress(`${type} Token Select`, 'open token selection modal');
    setTokenSelectionType(type);
    setShowTokenModal(true);
    setSearchQuery('');
  };

  const handleTokenSelection = (token: Token) => {
    logger.logButtonPress('Token Selection', `select ${token.symbol} as ${tokenSelectionType} token`);
    if (tokenSelectionType === 'input') {
      setSelectedInputToken(token);
      // If output token is the same, clear it
      if (selectedOutputToken?.address === token.address) {
        setSelectedOutputToken(null);
      }
    } else {
      setSelectedOutputToken(token);
      // If input token is the same, clear it
      if (selectedInputToken?.address === token.address) {
        setSelectedInputToken(null);
      }
    }
    setShowTokenModal(false);
  };

  const handleSwapTokens = () => {
    // Animate swap button
    swapButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    const tempToken = selectedInputToken;
    const tempAmount = inputAmount;
    setSelectedInputToken(selectedOutputToken);
    setSelectedOutputToken(tempToken);
    setInputAmount(outputAmount);
    setOutputAmount(tempAmount);
  };

  const handleMaxAmount = () => {
    if (!selectedInputToken?.balance) return;
    setInputAmount(selectedInputToken.balance);
  };

  const handleContinue = () => {
    if (!selectedInputToken || !selectedOutputToken || !inputAmount) {
      Alert.alert('Invalid Swap', 'Please select tokens and enter an amount');
      return;
    }

    if (parseFloat(inputAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to swap');
      return;
    }

    // Mock swap execution
    Alert.alert(
      'Swap Confirmation',
      `Swap ${inputAmount} ${selectedInputToken.symbol} for ${outputAmount} ${selectedOutputToken.symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            Alert.alert('Success', 'Swap executed successfully!');
            setInputAmount('');
            setOutputAmount('');
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTokenLogo = (token: Token) => {
    if (token.logoURI) {
      return (
        <Image 
          source={{ uri: token.logoURI }} 
          style={{ width: 32, height: 32, borderRadius: 16 }}
          onError={() => console.log('Failed to load image for token:', token.symbol)}
        />
      );
    }
    
    // Fallback to colored circle with first letter
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const colorIndex = token.symbol.charCodeAt(0) % colors.length;
    
    return (
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors[colorIndex],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
          {token.symbol.charAt(0)}
        </Text>
      </View>
    );
  };

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#000000',
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
            Swap
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#111827',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Settings Panel */}
        <Animated.View style={[settingsStyle, { 
          marginHorizontal: 20, 
          marginBottom: 16,
          opacity: showSettings ? 1 : 0,
          height: showSettings ? 'auto' : 0,
          overflow: 'hidden',
        }]}>
          <View style={{
            backgroundColor: '#111827',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#1f2937',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                Slippage Tolerance
              </Text>
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>
                {slippage}%
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              gap: 8,
            }}>
              {[0.1, 0.5, 1.0].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setSlippage(value)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: slippage === value ? '#3B82F6' : '#f1f5f9',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: slippage === value ? '#3B82F6' : '#e2e8f0',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: slippage === value ? '#ffffff' : '#64748b',
                    fontWeight: '600',
                  }}>
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Main Swap Container */}
        <View style={{ marginHorizontal: 20 }}>
          <View style={{
            backgroundColor: '#111827',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#1f2937',
          }}>
            {/* Input Token Card */}
            <Animated.View style={[inputCardStyle]}>
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    You Pay
                  </Text>
                  {selectedInputToken?.balance && (
                    <TouchableOpacity onPress={handleMaxAmount}>
                      <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '500' }}>
                        Balance: {parseFloat(selectedInputToken.balance).toFixed(4)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#000000',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#1f2937',
                }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="0.0"
                      value={inputAmount}
                      onChangeText={setInputAmount}
                      keyboardType="numeric"
                      style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        paddingVertical: 8,
                      }}
                      placeholderTextColor="#64748b"
                    />
                    {inputUSDValue > 0 && (
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        {formatCurrency(inputUSDValue)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleTokenSelect('input')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#0b1120',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      minWidth: 100,
                      borderWidth: 1,
                      borderColor: '#1f2937',
                    }}
                  >
                    {selectedInputToken ? (
                      <>
                        {getTokenLogo(selectedInputToken)}
                        <Text style={{ 
                          fontWeight: '600', 
                          color: '#FFFFFF', 
                          marginLeft: 8,
                          marginRight: 4,
                        }}>
                          {selectedInputToken.symbol}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                      </>
                    ) : (
                      <Text style={{ color: '#94A3B8' }}>
                        Select Token
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Swap Button */}
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <Animated.View style={swapButtonStyle}>
                <TouchableOpacity
                  onPress={handleSwapTokens}
                  disabled={!selectedInputToken || !selectedOutputToken}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#0b1120',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }}
                >
                  <Ionicons 
                    name="swap-vertical" 
                    size={20} 
                    color={selectedInputToken && selectedOutputToken ? "#3B82F6" : "#64748b"} 
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Output Token Card */}
            <Animated.View style={[outputCardStyle]}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>
                  You Receive
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#000000',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#1f2937',
                }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="0.0"
                      value={outputAmount}
                      onChangeText={() => {}} // Read-only
                      editable={false}
                      style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        paddingVertical: 8,
                      }}
                      placeholderTextColor="#64748b"
                    />
                    {outputUSDValue > 0 && (
                      <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        {formatCurrency(outputUSDValue)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleTokenSelect('output')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#0b1120',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      minWidth: 100,
                      borderWidth: 1,
                      borderColor: '#1f2937',
                    }}
                  >
                    {selectedOutputToken ? (
                      <>
                        {getTokenLogo(selectedOutputToken)}
                        <Text style={{ 
                          fontWeight: '600', 
                          color: '#FFFFFF', 
                          marginLeft: 8,
                          marginRight: 4,
                        }}>
                          {selectedOutputToken.symbol}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                      </>
                    ) : (
                      <Text style={{ color: '#94A3B8' }}>
                        Select Token
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Exchange Rate Info */}
            {selectedInputToken && selectedOutputToken && (
                             <View style={{
                 flexDirection: 'row',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 paddingVertical: 12,
                 borderTopWidth: 1,
                 borderTopColor: '#e2e8f0',
                 marginTop: 8,
               }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Ionicons name="time-outline" size={16} color="#94A3B8" />
                   <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>
                     Rate expires in {rateTimer.toString().padStart(2, '0')}:00s
                   </Text>
                 </View>
                 <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                   1 {selectedInputToken.symbol} = {((selectedOutputToken.currentPrice || 0) / (selectedInputToken.currentPrice || 1)).toFixed(6)} {selectedOutputToken.symbol}
                 </Text>
               </View>
            )}

                         {/* Swap Details */}
             {inputAmount && selectedInputToken && selectedOutputToken && (
               <View style={{
                 backgroundColor: '#000000',
                 borderRadius: 12,
                 padding: 16,
                 marginTop: 16,
                 borderWidth: 1,
                 borderColor: '#1f2937',
               }}>
                 <View style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   marginBottom: 12,
                 }}>
                   <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                     Price Impact
                   </Text>
                   <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '600' }}>
                     {mockQuote.priceImpact.toFixed(2)}%
                   </Text>
                 </View>
                 <View style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   marginBottom: 12,
                 }}>
                   <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                     Network Fee
                   </Text>
                   <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>
                     ~{formatCurrency(parseFloat(mockQuote.feeUSD))}
                   </Text>
                 </View>
                 <View style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                 }}>
                   <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                     Minimum Received
                   </Text>
                   <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>
                     {outputAmount} {selectedOutputToken.symbol}
                   </Text>
                 </View>
               </View>
             )}
          </View>
        </View>

                 {/* Swap Button */}
         <View style={{ marginHorizontal: 20, marginTop: 24 }}>
           <TouchableOpacity
             onPress={handleContinue}
             disabled={!selectedInputToken || !selectedOutputToken || !inputAmount}
             style={{
               backgroundColor: (!selectedInputToken || !selectedOutputToken || !inputAmount) ? '#f1f5f9' : '#3B82F6',
               borderRadius: 16,
               paddingVertical: 16,
               alignItems: 'center',
               opacity: (!selectedInputToken || !selectedOutputToken || !inputAmount) ? 0.5 : 1,
               borderWidth: 1,
               borderColor: (!selectedInputToken || !selectedOutputToken || !inputAmount) ? '#e2e8f0' : '#3B82F6',
             }}
           >
             <Text style={{
               fontSize: 16,
               fontWeight: '700',
               color: (!selectedInputToken || !selectedOutputToken || !inputAmount) ? '#64748b' : '#ffffff',
             }}>
               {!selectedInputToken || !selectedOutputToken ? 'Select Tokens' : 
                !inputAmount ? 'Enter Amount' : 'Swap'}
             </Text>
           </TouchableOpacity>
         </View>
      </ScrollView>

      {/* Token Selection Modal */}
      <Modal
        visible={showTokenModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFFFFF' }}>
              Select Token
            </Text>
            <TouchableOpacity
              onPress={() => setShowTokenModal(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#111827',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#1f2937',
              }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={{ padding: 20 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#111827',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: '#1f2937',
            }}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search tokens..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: '#FFFFFF',
                }}
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          {/* Token List */}
          <FlatList
            data={filteredTokens}
            keyExtractor={(item: Token) => item.address}
            renderItem={({ item }: { item: Token }) => (
              <TouchableOpacity
                onPress={() => handleTokenSelection(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <View style={{ marginRight: 12 }}>
                  {getTokenLogo(item)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {item.symbol}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                    {item.name}
                  </Text>
                  {item.currentPrice && (
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                      {formatCurrency(item.currentPrice)}
                    </Text>
                  )}
                </View>
                {tokenSelectionType === 'input' && item.balance && parseFloat(item.balance) > 0 && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                      {parseFloat(item.balance).toFixed(4)}
                    </Text>
                    {item.currentPrice && (
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                        ~{formatCurrency(parseFloat(item.balance) * item.currentPrice)}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </UniversalBackground>
  );
};