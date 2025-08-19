import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, Alert, ScrollView, TextInput, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../hooks/wallet/useWallet';
import { useSwap } from '../hooks/swap/useSwap';
import { usePrices } from '../hooks/token/usePrices';
import { walletService } from '../services/blockchain/walletService';
import { priceService, CoinInfo } from '../services/api/priceService';
import { Token, SwapParams, SwapQuote } from '../types';
import { logger } from '../utils/logger';
import { useDevWallet } from '../hooks/wallet/useDevWallet';
import { COMMON_TOKENS } from '../constants';
import { LiquidGlass } from '../components';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledFlatList = styled(FlatList);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);

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

  const { currentWallet, activeNetwork, isConnected } = useWallet();
  const { connectDevWallet } = useDevWallet();
  const { calculateUSDValue } = usePrices();
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
        const result = await priceService.fetchTopCoins(100);
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
          const commonTokens = (COMMON_TOKENS as any)[activeNetwork] || [];
          
          const allTokensCombined = [
            ...walletTokens,
            ...commonTokens,
            ...tokensFromAPI
          ];
          
          // Remove duplicates based on symbol
          const uniqueTokens = allTokensCombined.filter((token, index, self) => 
            index === self.findIndex(t => t.symbol === token.symbol)
          );
          
          setAllTokens(uniqueTokens);
        }
      } catch (error) {
        console.error('Failed to fetch crypto tokens:', error);
        // Fallback to wallet tokens and common tokens only
        const walletTokens = getAvailableTokens();
        const commonTokens = (COMMON_TOKENS as any)[activeNetwork] || [];
        
        // Add some popular tokens as fallback
        const fallbackTokens: Token[] = [
          {
            address: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            decimals: 8,
            balance: '0',
            logoURI: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            currentPrice: 43250.12,
            priceChange24h: 2.98,
            marketCap: 847123456789,
          },
          {
            address: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            balance: '0',
            logoURI: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            currentPrice: 2650.45,
            priceChange24h: 1.94,
            marketCap: 318765432109,
          },
          {
            address: 'binancecoin',
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
    }, [])
  );

  // Filter tokens based on search query
  const filteredTokens = allTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock selected tokens for development
  const [selectedInputToken, setSelectedInputToken] = useState<Token | null>({
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '1250.875',
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
    const tempToken = selectedInputToken;
    const tempAmount = inputAmount;
    setSelectedInputToken(selectedOutputToken);
    setSelectedOutputToken(tempToken);
    setInputAmount(outputAmount);
    setOutputAmount(tempAmount);
    clearError();
  };

  const handleMaxAmount = () => {
    if (!selectedInputToken || !currentWallet) return;

    let maxAmount = '0';
    
    // Check if it's native token
    if (selectedInputToken.address === '0x0000000000000000000000000000000000000000' || 
        selectedInputToken.address === 'So11111111111111111111111111111111111111112') {
      maxAmount = currentWallet.balance;
    } else {
      const tokenBalance = currentWallet.tokens.find(t => t.address === selectedInputToken.address);
      maxAmount = tokenBalance?.balance || '0';
    }

    setInputAmount(maxAmount);
  };

  const handleExecuteSwap = async () => {
    if (!selectedInputToken || !selectedOutputToken || !inputAmount) {
      Alert.alert('Error', 'Please select tokens and enter an amount');
      return;
    }

    try {
      // For development mode, we'll use a mock quote
      const mockSwapQuote: SwapQuote = {
        inputToken: selectedInputToken,
        outputToken: selectedOutputToken,
        inputAmount,
        outputAmount,
        priceImpact: mockQuote.priceImpact,
        route: [],
        slippage,
        exchangeRate: mockQuote.exchangeRate,
      };

      const result = await executeSwap(mockSwapQuote);
      
      // executeSwap returns the transaction hash on success
      if (result) {
        Alert.alert('Success', 'Swap executed successfully!');
        setInputAmount('');
        setOutputAmount('');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to execute swap');
    }
  };

  const inputUSDValue = selectedInputToken && inputAmount 
    ? calculateUSDValue(selectedInputToken.address, inputAmount) 
    : null;

  const outputUSDValue = selectedOutputToken && outputAmount 
    ? calculateUSDValue(selectedOutputToken.address, outputAmount) 
    : null;

  // For development mode, always show the swap interface
  // In production, you would check: if (!currentWallet && !isConnected) { ... }

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
        <StyledView className="px-6 pt-6 pb-4">
          <StyledText className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Swap Tokens
          </StyledText>
          <StyledText className="text-sm text-slate-600 text-center">
            Exchange tokens at the best rates
          </StyledText>
        </StyledView>

        {/* Swap Form */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            {/* Input Token */}
            <StyledView className="mb-4">
              <StyledView className="flex-row items-center justify-between mb-2">
                <StyledText className="text-sm text-slate-600">
                  From
                </StyledText>
                {selectedInputToken && (
                  <StyledTouchableOpacity onPress={handleMaxAmount}>
                    <StyledText className="text-sm text-blue-600 font-medium">
                      MAX
                    </StyledText>
                  </StyledTouchableOpacity>
                )}
              </StyledView>

              <StyledView className="flex-row items-center space-x-3">
                <StyledView className="flex-1">
                  <StyledView className="border border-gray-200 rounded-lg px-3 py-3 bg-white">
                    <StyledTextInput
                      placeholder="0.0"
                      value={inputAmount}
                      onChangeText={setInputAmount}
                      keyboardType="numeric"
                      className="text-xl text-slate-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </StyledView>
                  {inputUSDValue && (
                    <StyledText className="text-sm text-slate-500 mt-1">
                      ~${inputUSDValue.toFixed(2)}
                    </StyledText>
                  )}
                </StyledView>

                <StyledTouchableOpacity
                  onPress={() => handleTokenSelect('input')}
                  className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                >
                  {selectedInputToken ? (
                    <>
                      <StyledText className="font-medium text-slate-900 mr-1">
                        {selectedInputToken.symbol}
                      </StyledText>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </>
                  ) : (
                    <StyledText className="text-slate-500">
                      Select Token
                    </StyledText>
                  )}
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>

            {/* Swap Button */}
            <StyledView className="items-center my-2">
              <LiquidGlass
                className="p-2"
                cornerRadius={100}
                elasticity={0.3}
                onPress={handleSwapTokens}
                disabled={!selectedInputToken || !selectedOutputToken}
              >
                <Ionicons 
                  name="swap-vertical" 
                  size={20} 
                  color={selectedInputToken && selectedOutputToken ? "#3B82F6" : "#9CA3AF"} 
                />
              </LiquidGlass>
            </StyledView>

            {/* Output Token */}
            <StyledView className="mb-4">
              <StyledText className="text-sm text-slate-600 mb-2">
                To
              </StyledText>

              <StyledView className="flex-row items-center space-x-3">
                <StyledView className="flex-1">
                  <StyledView className="border border-gray-200 rounded-lg px-3 py-3 bg-white">
                    <StyledTextInput
                      placeholder="0.0"
                      value={outputAmount}
                      onChangeText={() => {}} // Read-only
                      editable={false}
                      className="text-xl text-slate-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </StyledView>
                  {outputUSDValue && (
                    <StyledText className="text-sm text-slate-500 mt-1">
                      ~${outputUSDValue.toFixed(2)}
                    </StyledText>
                  )}
                </StyledView>

                <StyledTouchableOpacity
                  onPress={() => handleTokenSelect('output')}
                  className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                >
                  {selectedOutputToken ? (
                    <>
                      <StyledText className="font-medium text-slate-900 mr-1">
                        {selectedOutputToken.symbol}
                      </StyledText>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </>
                  ) : (
                    <StyledText className="text-slate-500">
                      Select Token
                    </StyledText>
                  )}
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>

            {/* Quote Info */}
            {inputAmount && selectedInputToken && selectedOutputToken && (
              <LiquidGlass
                className="mb-4 p-4"
                cornerRadius={16}
                elasticity={0.15}
                blurAmount={0.6}
              >
                <StyledView className="flex-row justify-between items-center mb-2">
                  <StyledText className="text-sm text-slate-600">
                    Exchange Rate
                  </StyledText>
                  <StyledText className="text-sm font-medium text-slate-900">
                    1 {selectedInputToken.symbol} = {parseFloat(mockQuote.exchangeRate).toFixed(6)} {selectedOutputToken.symbol}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row justify-between items-center mb-2">
                  <StyledText className="text-sm text-slate-600">
                    Price Impact
                  </StyledText>
                  <StyledText className="text-sm font-medium text-green-600">
                    {mockQuote.priceImpact.toFixed(2)}%
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row justify-between items-center mb-2">
                  <StyledText className="text-sm text-slate-600">
                    Network Fee
                  </StyledText>
                  <StyledText className="text-sm font-medium text-slate-900">
                    ~${mockQuote.feeUSD}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-sm text-slate-600">
                    Slippage Tolerance
                  </StyledText>
                  <StyledTouchableOpacity onPress={() => setShowSlippageSettings(true)}>
                    <StyledText className="text-sm font-medium text-blue-600">
                      {slippage}%
                    </StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              </LiquidGlass>
            )}

            {/* Swap Button */}
            <LiquidGlass
              className={`w-full py-3 px-4 rounded-lg ${
                selectedInputToken && selectedOutputToken && inputAmount
                  ? 'bg-blue-600/20'
                  : 'bg-gray-300/20'
              }`}
              cornerRadius={16}
              elasticity={0.2}
              onPress={handleExecuteSwap}
              disabled={!selectedInputToken || !selectedOutputToken || !inputAmount}
            >
              <StyledText className={`text-center font-semibold ${
                selectedInputToken && selectedOutputToken && inputAmount
                  ? 'text-blue-700'
                  : 'text-gray-500'
              }`}>
                {isLoading ? 'Getting Quote...' : 'Swap'}
              </StyledText>
            </LiquidGlass>
          </StyledView>
        </StyledView>

        {/* Recent Swaps */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            Recent Swaps
          </StyledText>
          
          <LiquidGlass
            className="p-6"
            cornerRadius={20}
            elasticity={0.1}
            blurAmount={0.6}
          >
            <StyledView className="space-y-3">
              <StyledView className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                <StyledView className="flex-row items-center">
                  <StyledView className="w-8 h-8 bg-blue-100 rounded-full mr-3" />
                  <StyledView>
                    <StyledText className="font-medium text-slate-900">ETH → USDC</StyledText>
                    <StyledText className="text-sm text-slate-500">2 hours ago</StyledText>
                  </StyledView>
                </StyledView>
                <StyledView className="items-end">
                  <StyledText className="font-medium text-slate-900">+2,650.45 USDC</StyledText>
                  <StyledText className="text-sm text-green-600">+$2,650.45</StyledText>
                </StyledView>
              </StyledView>

              <StyledView className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                <StyledView className="flex-row items-center">
                  <StyledView className="w-8 h-8 bg-green-100 rounded-full mr-3" />
                  <StyledView>
                    <StyledText className="font-medium text-slate-900">USDC → ETH</StyledText>
                    <StyledText className="text-sm text-slate-500">1 day ago</StyledText>
                  </StyledView>
                </StyledView>
                <StyledView className="items-end">
                  <StyledText className="font-medium text-slate-900">+0.95 ETH</StyledText>
                  <StyledText className="text-sm text-red-600">-$2,517.93</StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </LiquidGlass>
        </StyledView>
      </StyledScrollView>

      {/* Token Selection Modal */}
      <Modal
        visible={showTokenModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          {/* Modal Header */}
          <StyledView className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <StyledText className="text-lg font-semibold text-slate-900">
              Select Token
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => setShowTokenModal(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </StyledTouchableOpacity>
          </StyledView>

          {/* Search Input */}
          <StyledView className="p-4">
            <StyledView className="flex-row items-center border border-gray-200 rounded-lg px-3 py-3 bg-white">
              <Ionicons name="search" size={20} color="#6B7280" />
              <StyledTextInput
                placeholder="Search tokens..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-slate-900"
                placeholderTextColor="#9CA3AF"
              />
            </StyledView>
          </StyledView>

          {/* Token List */}
          <FlatList
            data={filteredTokens}
            keyExtractor={(item: Token) => item.address}
            renderItem={({ item }: { item: Token }) => (
              <StyledTouchableOpacity
                onPress={() => handleTokenSelection(item)}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                {item.logoURI ? (
                  <Image 
                    source={{ uri: item.logoURI }} 
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                    onError={() => {
                      // Handle image loading errors silently
                      console.log('Failed to load image for token:', item.symbol);
                    }}
                  />
                ) : (
                  <StyledView className="w-8 h-8 bg-gray-200 rounded-full mr-3" />
                )}
                <StyledView className="flex-1">
                  <StyledText className="font-medium text-slate-900">{item.symbol}</StyledText>
                  <StyledText className="text-sm text-slate-500">{item.name}</StyledText>
                  {item.currentPrice && (
                    <StyledText className="text-xs text-slate-400">
                      ${item.currentPrice.toFixed(2)}
                    </StyledText>
                  )}
                </StyledView>
                {tokenSelectionType === 'input' && item.balance && parseFloat(item.balance) > 0 && (
                  <StyledView className="items-end">
                    <StyledText className="text-sm text-slate-600">
                      {parseFloat(item.balance).toFixed(4)}
                    </StyledText>
                    {item.currentPrice && (
                      <StyledText className="text-xs text-slate-400">
                        ~${(parseFloat(item.balance) * item.currentPrice).toFixed(2)}
                      </StyledText>
                    )}
                  </StyledView>
                )}
              </StyledTouchableOpacity>
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <StyledView className="p-8 items-center">
                {isLoadingTokens ? (
                  <StyledText className="text-slate-500 text-center">
                    Loading tokens...
                  </StyledText>
                ) : (
                  <StyledText className="text-slate-500 text-center">
                    No tokens found
                  </StyledText>
                )}
              </StyledView>
            }
          />

          {/* Popular Tokens */}
          {searchQuery === '' && (
            <StyledView className="p-4 border-t border-gray-200">
              <StyledText className="text-sm font-medium text-slate-600 mb-3">
                Popular Tokens
              </StyledText>
              <StyledView className="flex-row flex-wrap">
                {allTokens.slice(0, 6).map((token) => (
                  <StyledTouchableOpacity
                    key={token.address}
                    onPress={() => handleTokenSelection(token)}
                    className="bg-gray-100 px-3 py-2 rounded-lg mr-2 mb-2 flex-row items-center"
                  >
                    {token.logoURI ? (
                      <Image 
                        source={{ uri: token.logoURI }} 
                        style={{ width: 16, height: 16, borderRadius: 8, marginRight: 4 }}
                        onError={() => {
                          // Handle image loading errors silently
                          console.log('Failed to load image for popular token:', token.symbol);
                        }}
                      />
                    ) : (
                      <StyledView className="w-4 h-4 bg-gray-300 rounded-full mr-1" />
                    )}
                    <StyledText className="text-sm font-medium text-slate-900">
                      {token.symbol}
                    </StyledText>
                  </StyledTouchableOpacity>
                ))}
              </StyledView>
            </StyledView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Slippage Settings Modal */}
      <Modal
        visible={showSlippageSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <StyledView className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <StyledText className="text-lg font-semibold text-slate-900">
              Slippage Tolerance
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => setShowSlippageSettings(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </StyledTouchableOpacity>
          </StyledView>

          <StyledView className="p-4">
            <StyledText className="text-sm text-slate-600 mb-4">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </StyledText>

            <StyledView className="flex-row space-x-2 mb-4">
              {[0.1, 0.5, 1.0].map((value) => (
                <StyledTouchableOpacity
                  key={value}
                  onPress={() => setSlippage(value)}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    slippage === value
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <StyledText className={`text-center font-medium ${
                    slippage === value ? 'text-white' : 'text-slate-900'
                  }`}>
                    {value}%
                  </StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledView>

            <StyledView className="mb-4">
              <StyledText className="text-sm text-slate-600 mb-2">Custom</StyledText>
              <StyledView className="flex-row items-center border border-gray-200 rounded-lg px-3 py-3 bg-white">
                <StyledTextInput
                  placeholder="0.5"
                  value={slippage.toString()}
                  onChangeText={(text) => setSlippage(parseFloat(text) || 0.5)}
                  keyboardType="numeric"
                  className="flex-1 text-slate-900"
                  placeholderTextColor="#9CA3AF"
                />
                <StyledText className="text-slate-500 mr-3">%</StyledText>
              </StyledView>
            </StyledView>

            <StyledTouchableOpacity
              onPress={() => setShowSlippageSettings(false)}
              className="w-full py-3 px-4 bg-blue-600 rounded-lg"
            >
              <StyledText className="text-center font-semibold text-white">
                Confirm
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};