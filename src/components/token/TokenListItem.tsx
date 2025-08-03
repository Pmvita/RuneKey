import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Token } from '../../types';
import { usePrices } from '../../hooks/token/usePrices';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface TokenListItemProps {
  token: Token & { coinId?: string };
  onPress?: () => void;
  showBalance?: boolean;
  showPrice?: boolean;
  showPriceChange?: boolean;
}

export const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  onPress,
  showBalance = true,
  showPrice = true,
  showPriceChange = true,
}) => {
  const { getFormattedPrice, getFormattedPriceChange, calculateUSDValue } = usePrices();

  const formattedPrice = getFormattedPrice(token.address);
  const priceChange = getFormattedPriceChange(token.address);
  
  // For dev wallet tokens, use pre-calculated USD value
  const usdValue = token.usdValue || (token.balance ? calculateUSDValue(token.address, token.balance) : null);

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatUSDValue = (value: number | null) => {
    if (!value || isNaN(value)) return '$0.00';
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <StyledTouchableOpacity
      className="flex-row items-center p-4 bg-glass-white dark:bg-glass-dark border-b border-glass-frost dark:border-ice-700/30"
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      {/* Token Icon */}
      <StyledView className="mr-3">
        {token.logoURI ? (
          <StyledImage
            source={{ uri: token.logoURI }}
            className="w-10 h-10 rounded-full"
            onError={() => {
              // Fallback to text if image fails to load
            }}
          />
        ) : (
          <StyledView className="w-10 h-10 rounded-full bg-frost-200 dark:bg-ice-700 items-center justify-center">
            <StyledText className="text-frost-700 dark:text-ice-300 font-bold text-sm">
              {token.symbol?.charAt(0) || '?'}
            </StyledText>
          </StyledView>
        )}
      </StyledView>

      {/* Token Info */}
      <StyledView className="flex-1">
        <StyledView className="flex-row items-center justify-between">
          <StyledView>
            <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
              {token.symbol || 'UNKNOWN'}
            </StyledText>
            <StyledText className="text-sm text-ice-500 dark:text-ice-400">
              {token.name || 'Unknown Token'}
            </StyledText>
          </StyledView>

          {showBalance && (
            <StyledView className="items-end">
              <StyledText className="text-lg font-semibold text-ice-900 dark:text-ice-100">
                {formatBalance(token.balance) || '0'}
              </StyledText>
              {usdValue && (
                <StyledText className="text-sm text-ice-500 dark:text-ice-400">
                  {formatUSDValue(usdValue) || '$0.00'}
                </StyledText>
              )}
            </StyledView>
          )}
        </StyledView>

        {/* Price Info */}
        {(showPrice || showPriceChange) && (
          <StyledView className="flex-row items-center justify-between mt-2">
            {showPrice && (
              <StyledText className="text-sm text-ice-600 dark:text-ice-300">
                {formattedPrice || 'Price unavailable'}
              </StyledText>
            )}

            {showPriceChange && priceChange && (
              <StyledView 
                className={
                  priceChange.isPositive 
                    ? 'px-2 py-1 rounded bg-green-100 dark:bg-green-900' 
                    : 'px-2 py-1 rounded bg-red-100 dark:bg-red-900'
                }
              >
                <StyledText 
                  className={
                    priceChange.isPositive 
                      ? 'text-xs font-medium text-green-800 dark:text-green-200' 
                      : 'text-xs font-medium text-red-800 dark:text-red-200'
                  }
                >
                  {priceChange.formatted || ''}
                </StyledText>
              </StyledView>
            )}
          </StyledView>
        )}
      </StyledView>
    </StyledTouchableOpacity>
  );
};