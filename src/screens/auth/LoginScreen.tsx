import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { logger } from '../../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onCreateAccount: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess, 
  onCreateAccount 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { connectDeveloperWallet } = useWalletStore();

  const handleLogin = async () => {
    logger.logButtonPress('Sign In', 'attempt login', { email });
    
    if (!email || !password) {
      logger.logError('Login', 'Missing email or password');
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Here you would normally validate credentials
      logger.logButtonPress('Sign In', 'login successful');
      onLoginSuccess();
    } catch (error) {
      logger.logError('Login', error);
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeveloperLogin = () => {
    console.log('Developer mode button pressed');
    logger.logButtonPress('Developer Mode Enter', 'connect developer wallet');
    connectDeveloperWallet();
    console.log('Developer wallet connected, calling onLoginSuccess');
    onLoginSuccess();
  };

  const handleSocialLogin = (provider: string) => {
    logger.logButtonPress(`${provider} Login`, 'social login attempt');
    Alert.alert('Coming Soon', `${provider} login will be available soon!`);
  };

  const handleForgotPassword = () => {
    logger.logButtonPress('Forgot Password', 'navigate to password reset');
    Alert.alert('Forgot Password', 'Password reset will be available soon!');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      {/* Icy blue background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          backgroundColor: '#0f172a', // Fallback for React Native
        }}
      />
      
      <StyledView className="flex-1 justify-center px-6">
        {/* App Logo */}
        <StyledView className="items-center mb-12">
          <StyledView className="w-20 h-20 bg-white/90 dark:bg-gray-800/90 border-2 border-frost-300 rounded-full items-center justify-center mb-4 shadow-lg">
            <StyledImage
              source={require('../../../assets/icon.png')}
              className="w-12 h-12"
            />
          </StyledView>
          <StyledText className="text-3xl font-bold text-ice-200 dark:text-ice-100 mb-2">
            Welcome Back
          </StyledText>
          <StyledText className="text-lg text-ice-200 dark:text-ice-400 text-center">
            Sign in to your RuneKey account
          </StyledText>
        </StyledView>

        {/* Login Form */}
        <Card variant="frost" className="p-6 mb-6">
          <StyledView className="space-y-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            {/* Spacer between password input and Sign In button */}
            <StyledView className="h-4" />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="frost"
              fullWidth
            />

            <StyledTouchableOpacity onPress={handleForgotPassword}>
              <StyledText className="text-center text-ice-300 dark:text-ice-400 font-medium">
                Forgot Password?
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </Card>

        {/* Spacer */}
        <StyledView className="h-8" />

        {/* Social Login Options */}
        <Card variant="ice" className="p-6 mb-6">
          <StyledText className="text-center text-ice-200 dark:text-ice-300 mb-4 font-medium">
            Or continue with
          </StyledText>
          
          <StyledView className="flex-row justify-around">
            <StyledTouchableOpacity
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm"
              onPress={() => handleSocialLogin('Google')}
            >
              <Ionicons name="logo-google" size={24} color="#4285F4" />
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm"
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm"
              onPress={() => handleSocialLogin('X')}
            >
              <Ionicons name="logo-twitter" size={24} color="#000000" />
            </StyledTouchableOpacity>
          </StyledView>
        </Card>

        {/* Create Account */}
        <StyledView className="flex-row justify-center mb-6">
          <StyledText className="text-ice-200 dark:text-ice-400">
            Don't have an account?{' '}
          </StyledText>
          <StyledTouchableOpacity onPress={() => {
            logger.logButtonPress('Create Account', 'navigate to account creation');
            onCreateAccount();
          }}>
            <StyledText className="text-frost-400 dark:text-frost-400 font-semibold">
              Create Account
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        {/* Developer Mode */}
        <Card variant="ice" className="p-4">
          <StyledView className="flex-row items-center justify-between">
            <StyledView className="flex-row items-center">
                              <StyledView className="w-10 h-10 bg-frost-200 dark:bg-frost-900 rounded-full items-center justify-center mr-3">
                <Ionicons name="code-slash" size={20} color="#0ea5e9" />
              </StyledView>
              <StyledView>
                <StyledText className="text-base font-semibold text-ice-300 dark:text-ice-100">
                  Developer Mode
                </StyledText>
                <StyledText className="text-sm text-ice-200 dark:text-ice-400">
                  Skip login with mock data
                </StyledText>
              </StyledView>
            </StyledView>
            <Button
              title="Enter"
              onPress={handleDeveloperLogin}
              variant="frost"
              size="sm"
            />
          </StyledView>
        </Card>
      </StyledView>
    </SafeAreaView>
  );
};