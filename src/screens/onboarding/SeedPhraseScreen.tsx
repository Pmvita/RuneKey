import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface SeedPhraseScreenProps {
  seedPhrase: string[];
  onConfirm: () => void;
  onBack: () => void;
}

export const SeedPhraseScreen: React.FC<SeedPhraseScreenProps> = ({
  seedPhrase,
  onConfirm,
  onBack,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasWrittenDown, setHasWrittenDown] = useState(false);

  const handleReveal = () => {
    Alert.alert(
      'Security Warning',
      'Make sure you are in a private location and no one can see your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reveal', 
          onPress: () => setIsRevealed(true)
        },
      ]
    );
  };

  const handleConfirm = () => {
    if (!hasWrittenDown) {
      Alert.alert(
        'Backup Required',
        'Please confirm that you have written down your recovery phrase before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Backup',
      'Have you safely written down your 12-word recovery phrase? This is the only way to recover your wallet.',
      [
        { text: 'No, let me write it down', style: 'cancel' },
        { 
          text: 'Yes, I have written it down', 
          onPress: onConfirm
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
        }}
      />
      <StyledView 
        className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
        style={{
          backgroundColor: 'rgba(186, 230, 253, 0.4)',
          transform: [{ translateX: -20 }, { translateY: 20 }],
        }}
      />
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6 pb-4">
          <StyledView className="flex-row items-center mb-4">
            <StyledTouchableOpacity onPress={onBack} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </StyledTouchableOpacity>
            <StyledText className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Backup Wallet
            </StyledText>
          </StyledView>
          <StyledText className="text-gray-600 dark:text-gray-400">
            Write down your recovery phrase and store it safely
          </StyledText>
        </StyledView>

        <StyledView className="px-6">
          {/* Security Warning */}
          <Card variant="outlined" className="p-4 mb-6 border-red-200 dark:border-red-800">
            <StyledView className="flex-row items-start">
              <Ionicons name="warning" size={24} color="#EF4444" />
              <StyledView className="ml-3 flex-1">
                <StyledText className="text-red-800 dark:text-red-200 font-bold mb-2">
                  Critical Security Information
                </StyledText>
                <StyledView className="space-y-2">
                  <StyledText className="text-red-700 dark:text-red-300 text-sm">
                    • This recovery phrase is the ONLY way to restore your wallet
                  </StyledText>
                  <StyledText className="text-red-700 dark:text-red-300 text-sm">
                    • Never share it with anyone or store it digitally
                  </StyledText>
                  <StyledText className="text-red-700 dark:text-red-300 text-sm">
                    • Write it down on paper and store in a safe place
                  </StyledText>
                  <StyledText className="text-red-700 dark:text-red-300 text-sm">
                    • If you lose it, your funds will be lost forever
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </Card>

          {/* Seed Phrase Display */}
          <Card variant="outlined" className="p-6 mb-6">
            <StyledText className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
              Your 12-Word Recovery Phrase
            </StyledText>

            {!isRevealed ? (
              <StyledView className="items-center py-8">
                <StyledView className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                  <Ionicons name="eye-off" size={32} color="#6B7280" />
                </StyledView>
                <StyledText className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Your recovery phrase is hidden for security
                </StyledText>
                <Button
                  title="Reveal Recovery Phrase"
                  onPress={handleReveal}
                  variant="outline"
                />
              </StyledView>
            ) : (
              <>
                <StyledView className="grid grid-cols-2 gap-3">
                  {seedPhrase.map((word, index) => (
                    <StyledView 
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex-row items-center"
                    >
                      <StyledText className="text-sm text-gray-500 dark:text-gray-400 w-6">
                        {index + 1}.
                      </StyledText>
                      <StyledText className="text-base font-medium text-gray-900 dark:text-gray-100 ml-2">
                        {word}
                      </StyledText>
                    </StyledView>
                  ))}
                </StyledView>

                <StyledView className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <StyledView className="flex-row items-start">
                    <Ionicons name="create" size={20} color="#F59E0B" />
                    <StyledText className="text-yellow-800 dark:text-yellow-200 ml-3 flex-1">
                      Write these words down in order on paper. Do not screenshot or copy to clipboard.
                    </StyledText>
                  </StyledView>
                </StyledView>
              </>
            )}
          </Card>

          {/* Confirmation Checkbox */}
          {isRevealed && (
            <Card variant="outlined" className="p-4 mb-6">
              <StyledTouchableOpacity 
                onPress={() => setHasWrittenDown(!hasWrittenDown)}
                className="flex-row items-center"
              >
                <StyledView className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  hasWrittenDown 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {hasWrittenDown && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </StyledView>
                <StyledText className="text-gray-900 dark:text-gray-100 flex-1">
                  I have written down my recovery phrase on paper and stored it in a safe place
                </StyledText>
              </StyledTouchableOpacity>
            </Card>
          )}

          {/* Continue Button */}
          {isRevealed && (
            <Button
              title="Continue"
              onPress={handleConfirm}
              disabled={!hasWrittenDown}
              fullWidth
            />
          )}
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};