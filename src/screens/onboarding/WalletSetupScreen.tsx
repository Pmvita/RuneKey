import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useWalletStore } from '../../stores/wallet/useWalletStore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);

interface WalletSetupScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export const WalletSetupScreen: React.FC<WalletSetupScreenProps> = ({
  onCreateWallet,
  onImportWallet,
}) => {

  return (
    <SafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6 pb-4 z-10">
          <StyledText className="text-3xl font-bold text-ice-900 dark:text-ice-100 mb-2">
            Set up your wallet
          </StyledText>
          <StyledText className="text-lg text-ice-600 dark:text-ice-400">
            Choose how you'd like to get started with RuneKey
          </StyledText>
        </StyledView>

        <StyledView className="px-6">
          {/* Create New Wallet */}
          <Card variant="frost" className="p-6 mb-4">
            <StyledView className="items-center mb-4">
              <StyledView className="w-16 h-16 bg-glass-white dark:bg-glass-dark border-2 border-glass-frost dark:border-ice-700/50 rounded-full items-center justify-center mb-3 shadow-lg">
                <StyledImage
                  source={require('../../../assets/icon.png')}
                  className="w-8 h-8"
                  resizeMode="contain"
                />
              </StyledView>
              <StyledText className="text-xl font-bold text-ice-900 dark:text-ice-100 mb-2">
                Create a new wallet
              </StyledText>
              <StyledText className="text-ice-600 dark:text-ice-400 text-center mb-4">
                Generate a new wallet with a secure 12-word recovery phrase
              </StyledText>
            </StyledView>

            <StyledView className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg mb-4">
              <StyledView className="flex-row items-start">
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <StyledView className="ml-3 flex-1">
                  <StyledText className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    Important Security Notice
                  </StyledText>
                  <StyledText className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Your recovery phrase is the only way to restore your wallet. Write it down and store it safely.
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>

            <Button
              title="Create New Wallet"
              onPress={onCreateWallet}
              fullWidth
            />
          </Card>

          {/* Import Existing Wallet */}
          <Card variant="frost" className="p-6 mb-4">
            <StyledView className="items-center mb-4">
              <StyledView className="w-16 h-16 bg-glass-white dark:bg-glass-dark border-2 border-glass-frost dark:border-ice-700/50 rounded-full items-center justify-center mb-3 shadow-lg">
                <StyledImage
                  source={require('../../../assets/icon.png')}
                  className="w-8 h-8"
                  resizeMode="contain"
                />
              </StyledView>
              <StyledText className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Import existing wallet
              </StyledText>
              <StyledText className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Restore your wallet using a 12-word recovery phrase or private key
              </StyledText>
            </StyledView>

            <StyledView className="space-y-2 mb-4">
              <StyledView className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <StyledText className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  12 or 24-word recovery phrase
                </StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <StyledText className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  Private key (64 characters)
                </StyledText>
              </StyledView>
            </StyledView>

            <Button
              title="Import Wallet"
              onPress={onImportWallet}
              variant="outline"
              fullWidth
            />
          </Card>

          {/* Security Notice */}
          <StyledView className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
            <StyledView className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <StyledView className="ml-3 flex-1">
                <StyledText className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Your keys, your crypto
                </StyledText>
                <StyledText className="text-blue-700 dark:text-blue-300 text-sm">
                  RuneKey is a non-custodial wallet. We never store your private keys or have access to your funds.
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>


        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};