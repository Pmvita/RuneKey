import React, { useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SwapForm } from '../components/swap/SwapForm';
import { TokenListItem } from '../components/token/TokenListItem';
import { Input } from '../components/common/Input';
import { useWallet } from '../hooks/wallet/useWallet';
import { walletService } from '../services/blockchain/walletService';
import { Token } from '../types';
import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledFlatList = styled(FlatList);

export const SwapScreen: React.FC = () => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenSelectionType, setTokenSelectionType] = useState<'input' | 'output'>('input');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInputToken, setSelectedInputToken] = useState<Token | null>(null);
  const [selectedOutputToken, setSelectedOutputToken] = useState<Token | null>(null);

  const { currentWallet, activeNetwork } = useWallet();

  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('SwapScreen');
    }, [])
  );

  // Get available tokens (wallet tokens + common tokens)
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

  const availableTokens = getAvailableTokens();

  // Filter tokens based on search query
  const filteredTokens = availableTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderTokenItem = ({ item }: { item: Token }) => (
    <TokenListItem
      token={item}
      onPress={() => handleTokenSelection(item)}
      showBalance={tokenSelectionType === 'input'}
    />
  );

  if (!currentWallet) {
    return (
      <SafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
        <StyledView className="flex-1 justify-center items-center p-6">
          <StyledText className="text-lg text-gray-600 dark:text-gray-400 text-center">
            Please connect your wallet to use the swap feature
          </StyledText>
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
        }}
      />
      {/* Header */}
      <StyledView className="px-6 py-4 border-b border-glass-frost dark:border-ice-700/50 bg-glass-white dark:bg-glass-dark">
        <StyledText className="text-2xl font-bold text-ice-900 dark:text-ice-100">
          Swap Tokens
        </StyledText>
        <StyledText className="text-sm text-ice-600 dark:text-ice-400 mt-1">
          Exchange tokens at the best rates
        </StyledText>
      </StyledView>

      {/* Swap Form */}
      <SwapForm
        availableTokens={availableTokens}
        onTokenSelect={handleTokenSelect}
        selectedInputToken={selectedInputToken}
        selectedOutputToken={selectedOutputToken}
        onInputTokenChange={setSelectedInputToken}
        onOutputTokenChange={setSelectedOutputToken}
      />

      {/* Token Selection Modal */}
      <Modal
        visible={showTokenModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
          {/* Modal Header */}
          <StyledView className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <StyledText className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftElement={
                <Ionicons name="search" size={20} color="#6B7280" />
              }
            />
          </StyledView>

          {/* Token List */}
          <StyledFlatList
            data={filteredTokens}
            keyExtractor={(item) => item.address}
            renderItem={renderTokenItem}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <StyledView className="p-8 items-center">
                <StyledText className="text-gray-500 dark:text-gray-400 text-center">
                  No tokens found
                </StyledText>
              </StyledView>
            }
          />

          {/* Popular Tokens */}
          {searchQuery === '' && (
            <StyledView className="p-4 border-t border-gray-200 dark:border-gray-700">
              <StyledText className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Popular Tokens
              </StyledText>
              <StyledView className="flex-row flex-wrap">
                {walletService.getCommonTokens(activeNetwork).slice(0, 6).map((token) => (
                  <StyledTouchableOpacity
                    key={token.address}
                    onPress={() => handleTokenSelection(token)}
                    className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg mr-2 mb-2"
                  >
                    <StyledText className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {token.symbol}
                    </StyledText>
                  </StyledTouchableOpacity>
                ))}
              </StyledView>
            </StyledView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};