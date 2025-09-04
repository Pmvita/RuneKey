import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

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
      <View 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
        }}
      />
      <View 
        className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
        style={{
          backgroundColor: 'rgba(186, 230, 253, 0.4)',
          transform: [{ translateX: -20 }, { translateY: 20 }],
        }}
      />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Backup Wallet
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-400">
            Write down your recovery phrase and store it safely
          </Text>
        </View>

        <View className="px-6">
          {/* Security Warning */}
          <Card variant="outlined" className="p-4 mb-6 border-red-200 dark:border-red-800">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={24} color="#EF4444" />
              <View className="ml-3 flex-1">
                <Text className="text-red-800 dark:text-red-200 font-bold mb-2">
                  Critical Security Information
                </Text>
                <View className="space-y-2">
                  <Text className="text-red-700 dark:text-red-300 text-sm">
                    • This recovery phrase is the ONLY way to restore your wallet
                  </Text>
                  <Text className="text-red-700 dark:text-red-300 text-sm">
                    • Never share it with anyone or store it digitally
                  </Text>
                  <Text className="text-red-700 dark:text-red-300 text-sm">
                    • Write it down on paper and store in a safe place
                  </Text>
                  <Text className="text-red-700 dark:text-red-300 text-sm">
                    • If you lose it, your funds will be lost forever
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Seed Phrase Display */}
          <Card variant="outlined" className="p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
              Your 12-Word Recovery Phrase
            </Text>

            {!isRevealed ? (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                  <Ionicons name="eye-off" size={32} color="#6B7280" />
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Your recovery phrase is hidden for security
                </Text>
                <Button
                  title="Reveal Recovery Phrase"
                  onPress={handleReveal}
                  variant="outline"
                />
              </View>
            ) : (
              <>
                <View className="grid grid-cols-2 gap-3">
                  {seedPhrase.map((word, index) => (
                    <View 
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex-row items-center"
                    >
                      <Text className="text-sm text-gray-500 dark:text-gray-400 w-6">
                        {index + 1}.
                      </Text>
                      <Text className="text-base font-medium text-gray-900 dark:text-gray-100 ml-2">
                        {word}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <View className="flex-row items-start">
                    <Ionicons name="create" size={20} color="#F59E0B" />
                    <Text className="text-yellow-800 dark:text-yellow-200 ml-3 flex-1">
                      Write these words down in order on paper. Do not screenshot or copy to clipboard.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* Confirmation Checkbox */}
          {isRevealed && (
            <Card variant="outlined" className="p-4 mb-6">
              <TouchableOpacity 
                onPress={() => setHasWrittenDown(!hasWrittenDown)}
                className="flex-row items-center"
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  hasWrittenDown 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {hasWrittenDown && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text className="text-gray-900 dark:text-gray-100 flex-1">
                  I have written down my recovery phrase on paper and stored it in a safe place
                </Text>
              </TouchableOpacity>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};