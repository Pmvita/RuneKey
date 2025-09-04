import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

interface SeedVerifyScreenProps {
  seedPhrase: string[];
  onVerifySuccess: () => void;
  onBack: () => void;
}

export const SeedVerifyScreen: React.FC<SeedVerifyScreenProps> = ({
  seedPhrase,
  onVerifySuccess,
  onBack,
}) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [verificationPositions, setVerificationPositions] = useState<number[]>([]);

  useEffect(() => {
    // Pick 4 random positions to verify
    const positions = [];
    while (positions.length < 4) {
      const pos = Math.floor(Math.random() * 12);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    positions.sort((a, b) => a - b);
    setVerificationPositions(positions);

    // Create shuffled words for selection (correct words + some random words)
    const correctWords = positions.map(pos => seedPhrase[pos]);
    const otherWords = seedPhrase.filter((_, index) => !positions.includes(index));
    const randomWords = otherWords.sort(() => Math.random() - 0.5).slice(0, 8);
    const allWords = [...correctWords, ...randomWords].sort(() => Math.random() - 0.5);
    
    setShuffledWords(allWords);
  }, [seedPhrase]);

  const handleWordSelect = (word: string, positionIndex: number) => {
    const newSelected = [...selectedWords];
    newSelected[positionIndex] = word;
    setSelectedWords(newSelected);
  };

  const handleVerify = () => {
    const isCorrect = verificationPositions.every((pos, index) => 
      selectedWords[index] === seedPhrase[pos]
    );

    if (isCorrect) {
      Alert.alert(
        'Verification Successful!',
        'Your recovery phrase has been verified. Your wallet is now secure.',
        [{ text: 'Continue', onPress: onVerifySuccess }]
      );
    } else {
      Alert.alert(
        'Verification Failed',
        'Some words are incorrect. Please check your recovery phrase and try again.',
        [{ text: 'Try Again' }]
      );
      setSelectedWords([]);
    }
  };

  const isComplete = selectedWords.length === verificationPositions.length && 
                   selectedWords.every(word => word);

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
        className="absolute bottom-10 right-0 w-44 h-44 rounded-full opacity-8"
        style={{
          backgroundColor: 'rgba(186, 230, 253, 0.3)',
          transform: [{ translateX: 30 }],
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
              Verify Backup
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-400">
            Select the correct words to verify your recovery phrase
          </Text>
        </View>

        <View className="px-6">
          {/* Progress */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Progress
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {selectedWords.filter(w => w).length} of {verificationPositions.length}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <View 
                className="h-2 bg-primary-500 rounded-full"
                style={{ 
                  width: `${(selectedWords.filter(w => w).length / verificationPositions.length) * 100}%` 
                }}
              />
            </View>
          </View>

          {/* Verification Slots */}
          <Card variant="outlined" className="p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
              Fill in the missing words
            </Text>

            <View className="space-y-3">
              {verificationPositions.map((position, index) => (
                <View key={position} className="flex-row items-center">
                  <Text className="text-base font-medium text-gray-700 dark:text-gray-300 w-16">
                    Word {position + 1}:
                  </Text>
                  <View className="flex-1">
                    {selectedWords[index] ? (
                      <TouchableOpacity
                        onPress={() => {
                          const newSelected = [...selectedWords];
                          newSelected[index] = '';
                          setSelectedWords(newSelected);
                        }}
                        className="bg-primary-100 dark:bg-primary-900 border border-primary-300 dark:border-primary-700 p-3 rounded-lg"
                      >
                        <Text className="text-primary-800 dark:text-primary-200 font-medium">
                          {selectedWords[index]}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 rounded-lg">
                        <Text className="text-gray-400 dark:text-gray-500">
                          Select word {position + 1}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Word Selection */}
          <Card variant="outlined" className="p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Select from these words:
            </Text>

            <View className="flex-row flex-wrap">
              {shuffledWords.map((word, index) => {
                const isSelected = selectedWords.includes(word);
                const currentEmptyIndex = selectedWords.findIndex(w => !w);
                
                return (
                  <TouchableOpacity
                    key={`${word}-${index}`}
                    onPress={() => {
                      if (!isSelected && currentEmptyIndex !== -1) {
                        handleWordSelect(word, currentEmptyIndex);
                      }
                    }}
                    disabled={isSelected}
                    className={`m-1 px-4 py-2 rounded-lg border ${
                      isSelected 
                        ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text className={`font-medium ${
                      isSelected 
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {word}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Verify Button */}
          <Button
            title="Verify Recovery Phrase"
            onPress={handleVerify}
            disabled={!isComplete}
            fullWidth
          />

          {/* Security Note */}
          <View className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-800 dark:text-blue-200 ml-3 text-sm">
                This verification ensures you have correctly written down your recovery phrase. 
                Your wallet security depends on keeping this phrase safe.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};