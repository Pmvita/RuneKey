import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { TokenListItem } from '../token/TokenListItem';
import { useSwap } from '../../hooks/swap/useSwap';
import { useWallet } from '../../hooks/wallet/useWallet';
import { usePrices } from '../../hooks/token/usePrices';
import { Token, SwapParams } from '../../types';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface SwapFormProps {
  availableTokens: Token[];
  onTokenSelect: (type: 'input' | 'output') => void;
  selectedInputToken?: Token | null;
  selectedOutputToken?: Token | null;
  onInputTokenChange?: (token: Token | null) => void;
  onOutputTokenChange?: (token: Token | null) => void;
}

export const SwapForm: React.FC<SwapFormProps> = ({
  availableTokens,
  onTokenSelect,
  selectedInputToken,
  selectedOutputToken,
  onInputTokenChange,
  onOutputTokenChange,
}) => {
  const [inputToken, setInputToken] = useState<Token | null>(selectedInputToken || null);
  const [outputToken, setOutputToken] = useState<Token | null>(selectedOutputToken || null);
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');

  const { currentWallet } = useWallet();
  const { calculateUSDValue } = usePrices();
  const {
    isLoading,
    currentQuote,
    error,
    slippage,
    getQuote,
    executeSwap,
    validateSwap,
    getPriceImpactLevel,
    updateSlippage,
    clearError,
  } = useSwap();

  // Update output amount when quote changes
  useEffect(() => {
    if (currentQuote) {
      setOutputAmount(currentQuote.outputAmount);
    } else {
      setOutputAmount('');
    }
  }, [currentQuote]);

  // Sync input token with props
  useEffect(() => {
    if (selectedInputToken !== inputToken) {
      setInputToken(selectedInputToken || null);
    }
  }, [selectedInputToken]);

  // Sync output token with props
  useEffect(() => {
    if (selectedOutputToken !== outputToken) {
      setOutputToken(selectedOutputToken || null);
    }
  }, [selectedOutputToken]);

  // Notify parent of token changes
  useEffect(() => {
    onInputTokenChange?.(inputToken);
  }, [inputToken, onInputTokenChange]);

  useEffect(() => {
    onOutputTokenChange?.(outputToken);
  }, [outputToken, onOutputTokenChange]);

  // Get quote when input amount or tokens change
  useEffect(() => {
    if (inputToken && outputToken && inputAmount && parseFloat(inputAmount) > 0) {
      const params: SwapParams = {
        inputToken,
        outputToken,
        inputAmount,
        slippage,
        userAddress: currentWallet?.address || '',
      };

      const timer = setTimeout(() => {
        getQuote(params);
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [inputToken, outputToken, inputAmount, slippage, currentWallet, getQuote]);

  const handleSwapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount('');
    clearError();
  };

  const handleMaxAmount = () => {
    if (!inputToken || !currentWallet) return;

    let maxAmount = '0';
    
    // Check if it's native token
    if (inputToken.address === '0x0000000000000000000000000000000000000000' || 
        inputToken.address === 'So11111111111111111111111111111111111111112') {
      maxAmount = currentWallet.balance;
    } else {
      const tokenBalance = currentWallet.tokens.find(t => t.address === inputToken.address);
      maxAmount = tokenBalance?.balance || '0';
    }

    setInputAmount(maxAmount);
  };

  const handleExecuteSwap = async () => {
    if (!currentQuote) return;

    try {
      const validation = validateSwap({
        inputToken: inputToken!,
        outputToken: outputToken!,
        inputAmount,
        slippage,
        userAddress: currentWallet?.address || '',
      });

      if (!validation.isValid) {
        Alert.alert('Swap Error', validation.errors.join('\n'));
        return;
      }

      // Show confirmation alert
      const priceImpactLevel = getPriceImpactLevel(currentQuote.priceImpact);
      let message = `Swap ${inputAmount} ${inputToken?.symbol} for approximately ${outputAmount} ${outputToken?.symbol}?`;
      
      if (priceImpactLevel === 'high' || priceImpactLevel === 'warning') {
        message += `\n\nWarning: High price impact of ${currentQuote.priceImpact.toFixed(2)}%`;
      }

      Alert.alert(
        'Confirm Swap',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: async () => {
              try {
                await executeSwap(currentQuote);
                // Reset form
                setInputAmount('');
                setOutputAmount('');
                Alert.alert('Success', 'Swap completed successfully!');
              } catch (err) {
                Alert.alert('Swap Failed', err instanceof Error ? err.message : 'Unknown error');
              }
            }
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const inputUSDValue = inputToken && inputAmount 
    ? calculateUSDValue(inputToken.address, inputAmount) 
    : null;

  const outputUSDValue = outputToken && outputAmount 
    ? calculateUSDValue(outputToken.address, outputAmount) 
    : null;

  return (
    <StyledView className="p-4">
      <Card variant="outlined" className="p-4">
        {/* Input Token */}
        <StyledView className="mb-4">
          <StyledView className="flex-row items-center justify-between mb-2">
            <StyledText className="text-sm text-gray-600 dark:text-gray-400">
              From
            </StyledText>
            {inputToken && (
              <StyledTouchableOpacity onPress={handleMaxAmount}>
                <StyledText className="text-sm text-primary-500 font-medium">
                  MAX
                </StyledText>
              </StyledTouchableOpacity>
            )}
          </StyledView>

          <StyledView className="flex-row items-center space-x-3">
            <StyledView className="flex-1">
              <Input
                placeholder="0.0"
                value={inputAmount}
                onChangeText={setInputAmount}
                keyboardType="numeric"
                className="text-xl"
              />
              {inputUSDValue && (
                <StyledText className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ~${inputUSDValue.toFixed(2)}
                </StyledText>
              )}
            </StyledView>

            <StyledTouchableOpacity
              onPress={() => onTokenSelect('input')}
              className="flex-row items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
            >
              {inputToken ? (
                <>
                  <StyledText className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                    {inputToken.symbol}
                  </StyledText>
                  <Ionicons 
                    name="chevron-down" 
                    size={16} 
                    color="#6B7280" 
                  />
                </>
              ) : (
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Select Token
                </StyledText>
              )}
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>

        {/* Swap Button */}
        <StyledView className="items-center my-2">
          <StyledTouchableOpacity
            onPress={handleSwapTokens}
            className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
            disabled={!inputToken || !outputToken}
          >
            <Ionicons 
              name="swap-vertical" 
              size={20} 
              color={inputToken && outputToken ? "#3B82F6" : "#9CA3AF"} 
            />
          </StyledTouchableOpacity>
        </StyledView>

        {/* Output Token */}
        <StyledView className="mb-4">
          <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            To
          </StyledText>

          <StyledView className="flex-row items-center space-x-3">
            <StyledView className="flex-1">
              <Input
                placeholder="0.0"
                value={outputAmount}
                onChangeText={() => {}} // Read-only
                editable={false}
                className="text-xl"
              />
              {outputUSDValue && (
                <StyledText className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ~${outputUSDValue.toFixed(2)}
                </StyledText>
              )}
            </StyledView>

            <StyledTouchableOpacity
              onPress={() => onTokenSelect('output')}
              className="flex-row items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
            >
              {outputToken ? (
                <>
                  <StyledText className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                    {outputToken.symbol}
                  </StyledText>
                  <Ionicons 
                    name="chevron-down" 
                    size={16} 
                    color="#6B7280" 
                  />
                </>
              ) : (
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Select Token
                </StyledText>
              )}
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>

        {/* Quote Info */}
        {currentQuote && (
          <Card variant="default" className="mb-4 p-3">
            <StyledView className="flex-row justify-between items-center mb-2">
              <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                Exchange Rate
              </StyledText>
              <StyledText className="text-sm font-medium text-gray-900 dark:text-gray-100">
                1 {inputToken?.symbol} = {parseFloat(currentQuote.exchangeRate).toFixed(6)} {outputToken?.symbol}
              </StyledText>
            </StyledView>

            <StyledView className="flex-row justify-between items-center mb-2">
              <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                Price Impact
              </StyledText>
              <StyledText className={`text-sm font-medium ${
                getPriceImpactLevel(currentQuote.priceImpact) === 'high' || 
                getPriceImpactLevel(currentQuote.priceImpact) === 'warning'
                  ? 'text-red-500' 
                  : 'text-green-500'
              }`}>
                {currentQuote.priceImpact.toFixed(2)}%
              </StyledText>
            </StyledView>

            <StyledView className="flex-row justify-between items-center">
              <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                Slippage Tolerance
              </StyledText>
              <StyledText className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {slippage}%
              </StyledText>
            </StyledView>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <StyledView className="bg-red-50 dark:bg-red-900 p-3 rounded-lg mb-4">
            <StyledText className="text-red-700 dark:text-red-200 text-sm">
              {error}
            </StyledText>
          </StyledView>
        )}

        {/* Swap Button */}
        <Button
          title={isLoading ? 'Getting Quote...' : 'Swap'}
          onPress={handleExecuteSwap}
          disabled={!currentQuote || isLoading || !!error}
          loading={isLoading}
          fullWidth
        />
      </Card>
    </StyledView>
  );
};