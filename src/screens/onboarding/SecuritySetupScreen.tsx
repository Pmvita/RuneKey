import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);

interface SecuritySetupScreenProps {
  onComplete: () => void;
}

export const SecuritySetupScreen: React.FC<SecuritySetupScreenProps> = ({ onComplete }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);

  const handleSetupSecurity = () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    // TODO: Store PIN securely
    Alert.alert(
      'Security Setup Complete',
      'Your wallet is now protected with a PIN.',
      [{ text: 'Continue', onPress: onComplete }]
    );
  };

  const handleSkipSecurity = () => {
    Alert.alert(
      'Skip Security Setup?',
      'Are you sure you want to skip security setup? Your wallet will be less secure.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onComplete },
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
        className="absolute top-0 left-0 w-56 h-56 rounded-full opacity-8"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          transform: [{ translateX: -50 }, { translateY: -50 }],
        }}
      />
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6 pb-4">
          <StyledText className="text-3xl font-bold text-ice-900 dark:text-ice-100 mb-2">
            Secure your wallet
          </StyledText>
          <StyledText className="text-lg text-ice-600 dark:text-ice-400">
            Add an extra layer of security to protect your funds
          </StyledText>
        </StyledView>

        <StyledView className="px-6">
          {/* Security Options */}
          <Card variant="outlined" className="p-6 mb-6">
            <StyledView className="items-center mb-6">
              <StyledView className="w-20 h-20 bg-glass-white dark:bg-glass-dark border-2 border-glass-frost dark:border-ice-700/50 rounded-full items-center justify-center mb-4 shadow-lg">
                <StyledImage
                  source={require('../../../assets/icon.png')}
                  className="w-10 h-10"
                  resizeMode="contain"
                />
              </StyledView>
              <StyledText className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Set up PIN Protection
              </StyledText>
              <StyledText className="text-gray-600 dark:text-gray-400 text-center">
                Protect your wallet with a PIN code that you'll need to enter each time you open the app
              </StyledText>
            </StyledView>

            <StyledView className="space-y-4">
              <Input
                label="Create PIN"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry={!showPins}
                maxLength={6}
                rightElement={
                  <Ionicons 
                    name={showPins ? "eye-off" : "eye"} 
                    size={20} 
                    color="#6B7280"
                    onPress={() => setShowPins(!showPins)}
                  />
                }
              />

              <Input
                label="Confirm PIN"
                placeholder="Re-enter your PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry={!showPins}
                maxLength={6}
              />
            </StyledView>

            <StyledView className="mt-6">
              <Button
                title="Set Up PIN"
                onPress={handleSetupSecurity}
                disabled={!pin || !confirmPin || pin.length < 4}
                fullWidth
              />
            </StyledView>
          </Card>

          {/* Biometric Option (Future) */}
          <Card variant="outlined" className="p-6 mb-6 opacity-50">
            <StyledView className="flex-row items-center">
              <StyledView className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
                <Ionicons name="finger-print" size={24} color="#3B82F6" />
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Biometric Authentication
                </StyledText>
                <StyledText className="text-gray-600 dark:text-gray-400 text-sm">
                  Coming soon - Use fingerprint or Face ID
                </StyledText>
              </StyledView>
              <StyledText className="text-gray-400 text-sm">
                Soon
              </StyledText>
            </StyledView>
          </Card>

          {/* Security Benefits */}
          <Card variant="outlined" className="p-4 mb-6 border-green-200 dark:border-green-800">
            <StyledText className="text-lg font-bold text-green-800 dark:text-green-200 mb-3">
              Why use PIN protection?
            </StyledText>
            <StyledView className="space-y-2">
              <StyledView className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <StyledText className="text-green-700 dark:text-green-300 ml-2 text-sm">
                  Prevents unauthorized access to your wallet
                </StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <StyledText className="text-green-700 dark:text-green-300 ml-2 text-sm">
                  Protects your funds if device is lost or stolen
                </StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <StyledText className="text-green-700 dark:text-green-300 ml-2 text-sm">
                  Quick and convenient security layer
                </StyledText>
              </StyledView>
            </StyledView>
          </Card>

          {/* Skip Option */}
          <Button
            title="Skip for Now"
            onPress={handleSkipSecurity}
            variant="outline"
            fullWidth
          />

          <StyledView className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <StyledText className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              You can always enable PIN protection later in Settings
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};