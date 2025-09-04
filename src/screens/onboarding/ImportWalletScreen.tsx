import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { stringToSeedPhrase, validateSeedPhrase, isValidBIP39Word } from '../../utils/seedPhrase';
import { validateAddress, validatePrivateKey } from '../../utils/validation';
import { SUPPORTED_NETWORKS } from '../../constants';

interface ImportWalletScreenProps {
  onImportSuccess: (privateKeyOrMnemonic: string) => void;
  onBack: () => void;
}

type ImportMethod = 'seedPhrase' | 'privateKey';

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({
  onImportSuccess,
  onBack,
}) => {
  const [importMethod, setImportMethod] = useState<ImportMethod>('seedPhrase');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateInput = () => {
    if (!inputValue.trim()) {
      return { isValid: false, error: 'Please enter your recovery phrase or private key' };
    }

    if (importMethod === 'seedPhrase') {
      const words = stringToSeedPhrase(inputValue);
      
      if (![12, 15, 18, 21, 24].includes(words.length)) {
        return { 
          isValid: false, 
          error: 'Recovery phrase must be 12, 15, 18, 21, or 24 words long' 
        };
      }

      // Check if all words are valid BIP39 words
      const invalidWords = words.filter(word => !isValidBIP39Word(word));
      if (invalidWords.length > 0) {
        return { 
          isValid: false, 
          error: `Invalid words found: ${invalidWords.join(', ')}` 
        };
      }

      return { isValid: true };
    } else {
      // Validate private key for any supported network
      const isValid = SUPPORTED_NETWORKS.some(network => 
        validatePrivateKey(inputValue.trim(), network)
      );
      
      if (!isValid) {
        return { 
          isValid: false, 
          error: 'Invalid private key format' 
        };
      }

      return { isValid: true };
    }
  };

  const handleImport = async () => {
    const validation = validateInput();
    
    if (!validation.isValid) {
      Alert.alert('Invalid Input', validation.error);
      return;
    }

    setIsLoading(true);

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onImportSuccess(inputValue.trim());
    } catch (error) {
      Alert.alert(
        'Import Failed', 
        'Failed to import wallet. Please check your input and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getWordCount = () => {
    if (importMethod !== 'seedPhrase') return 0;
    return stringToSeedPhrase(inputValue).length;
  };

  const wordCount = getWordCount();

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
        className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.4)',
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
              Import Wallet
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-400">
            Restore your wallet using your recovery phrase or private key
          </Text>
        </View>

        <View className="px-6">
          {/* Import Method Selection */}
          <Card variant="outlined" className="p-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Import Method
            </Text>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setImportMethod('seedPhrase')}
                className={`flex-1 p-4 rounded-lg border mr-2 ${
                  importMethod === 'seedPhrase'
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                <Text className={`text-center font-medium ${
                  importMethod === 'seedPhrase'
                    ? 'text-primary-800 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Recovery Phrase
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setImportMethod('privateKey')}
                className={`flex-1 p-4 rounded-lg border ml-2 ${
                  importMethod === 'privateKey'
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                <Text className={`text-center font-medium ${
                  importMethod === 'privateKey'
                    ? 'text-primary-800 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Private Key
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Input Section */}
          <Card variant="outlined" className="p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {importMethod === 'seedPhrase' ? 'Recovery Phrase' : 'Private Key'}
            </Text>

            <Input
              placeholder={
                importMethod === 'seedPhrase'
                  ? 'Enter your 12-24 word recovery phrase...'
                  : 'Enter your private key...'
              }
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              numberOfLines={importMethod === 'seedPhrase' ? 4 : 2}
              autoCapitalize="none"
              secureTextEntry={importMethod === 'privateKey'}
            />

            {/* Word Count for Seed Phrase */}
            {importMethod === 'seedPhrase' && inputValue.trim() && (
              <View className="mt-3 flex-row items-center">
                <Ionicons 
                  name={[12, 15, 18, 21, 24].includes(wordCount) ? "checkmark-circle" : "warning"} 
                  size={16} 
                  color={[12, 15, 18, 21, 24].includes(wordCount) ? "#10B981" : "#F59E0B"} 
                />
                <Text className={`ml-2 text-sm ${
                  [12, 15, 18, 21, 24].includes(wordCount)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {wordCount} words
                  {[12, 15, 18, 21, 24].includes(wordCount) ? ' ✓' : ' (needs 12, 15, 18, 21, or 24 words)'}
                </Text>
              </View>
            )}

            {/* Security Warning */}
            <View className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text className="text-yellow-800 dark:text-yellow-200 ml-2 text-sm">
                  Make sure you're in a private location. Never share your recovery phrase or private key with anyone.
                </Text>
              </View>
            </View>
          </Card>

          {/* Import Button */}
          <Button
            title="Import Wallet"
            onPress={handleImport}
            disabled={!inputValue.trim()}
            loading={isLoading}
            fullWidth
          />

          {/* Help Section */}
          <Card variant="outlined" className="p-4 mt-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Need Help?
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row items-start">
                <Text className="text-gray-600 dark:text-gray-400 text-sm mr-2">•</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm flex-1">
                  Recovery phrases are usually 12 or 24 words separated by spaces
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-gray-600 dark:text-gray-400 text-sm mr-2">•</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm flex-1">
                  Private keys are 64-character hexadecimal strings
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-gray-600 dark:text-gray-400 text-sm mr-2">•</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm flex-1">
                  Make sure to type carefully - incorrect input cannot be recovered
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};