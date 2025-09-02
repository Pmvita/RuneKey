import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { logger } from '../../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);
const AnimatedView = styled(Animated.View);
const AnimatedText = styled(Animated.Text);

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
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { connectDeveloperWallet } = useWalletStore();

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const socialOpacity = useSharedValue(0);
  const socialTranslateY = useSharedValue(30);
  const devModeOpacity = useSharedValue(0);
  const shakeAnimation = useSharedValue(0);
  
  // New animation values
  const gradientRotation = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const buttonGradientOffset = useSharedValue(0);

  // Keyboard listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initial animations
  useEffect(() => {
    // Logo bounce animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    
    // Animated gradient background
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    
    // Button gradient animation
    buttonGradientOffset.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    setTimeout(() => {
      formOpacity.value = withTiming(1, { duration: 600 });
      formTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, 300);

    setTimeout(() => {
      socialOpacity.value = withTiming(1, { duration: 600 });
      socialTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, 500);

    setTimeout(() => {
      devModeOpacity.value = withTiming(1, { duration: 600 });
    }, 700);
  }, []);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      validateEmail(text);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      validatePassword(text);
    }
  };

  const triggerShakeAnimation = () => {
    shakeAnimation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  const triggerRippleEffect = () => {
    rippleScale.value = 0;
    rippleOpacity.value = 1;
    rippleScale.value = withTiming(1, { duration: 400 });
    rippleOpacity.value = withTiming(0, { duration: 400 });
  };

  const showSuccessAnimation = () => {
    setShowSuccess(true);
    successScale.value = 0;
    successOpacity.value = 0;
    
    successOpacity.value = withTiming(1, { duration: 300 });
    successScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    
    setTimeout(() => {
      successOpacity.value = withTiming(0, { duration: 300 });
      setShowSuccess(false);
    }, 2000);
  };

  const handleLogin = async () => {
    logger.logButtonPress('Sign In', 'attempt login', { email });
    
    // Trigger ripple effect
    triggerRippleEffect();
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      triggerShakeAnimation();
      return;
    }

    setLoading(true);
    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1500));
      logger.logButtonPress('Sign In', 'login successful');
      
      // Show success animation
      showSuccessAnimation();
      
      // Delay navigation to show success animation
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } catch (error) {
      logger.logError('Login', error);
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
      triggerShakeAnimation();
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

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const socialAnimatedStyle = useAnimatedStyle(() => ({
    opacity: socialOpacity.value,
    transform: [{ translateY: socialTranslateY.value }],
  }));

  const devModeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: devModeOpacity.value,
  }));

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}deg` }],
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const buttonGradientStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(buttonGradientOffset.value, [0, 1], [0, 100]) }],
  }));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      {/* Animated gradient background */}
      <AnimatedView 
        className="absolute inset-0"
        style={[
          {
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #334155 70%, #475569 100%)',
            backgroundColor: '#0f172a',
          },
          gradientAnimatedStyle
        ]}
      />
      
      {/* Subtle particle effect overlay */}
      <StyledView className="absolute inset-0 opacity-20">
        <StyledView className="absolute top-20 left-10 w-2 h-2 bg-frost-400 rounded-full" />
        <StyledView className="absolute top-40 right-20 w-1 h-1 bg-ice-300 rounded-full" />
        <StyledView className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-frost-300 rounded-full" />
        <StyledView className="absolute bottom-20 right-10 w-1 h-1 bg-ice-400 rounded-full" />
      </StyledView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StyledView className="flex-1 justify-center px-6 py-8">
            {/* App Logo with enhanced animation */}
            <AnimatedView className="items-center mb-8" style={logoAnimatedStyle}>
              <StyledView className="w-24 h-24 bg-gradient-to-br from-frost-400 to-ice-300 rounded-full items-center justify-center mb-6 shadow-2xl">
                <StyledView className="w-20 h-20 bg-white/95 rounded-full items-center justify-center">
                  <StyledImage
                    source={require('../../../assets/icon.png')}
                    className="w-14 h-14"
                  />
                </StyledView>
              </StyledView>
              <AnimatedText className="text-4xl font-bold text-ice-100 mb-3 text-center">
                Welcome Back
              </AnimatedText>
              <AnimatedText className="text-lg text-ice-300 text-center leading-6">
                Sign in to your RuneKey account
              </AnimatedText>
            </AnimatedView>

            {/* Enhanced Login Form */}
            <AnimatedView style={[formAnimatedStyle, shakeAnimatedStyle]}>
              <Card variant="frost" className="p-6 mb-12 shadow-xl">
                <StyledView className="space-y-5">
                  <Input
                    label="Email Address"
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={emailError}
                    leftElement={
                      <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                    }
                  />
                  
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    error={passwordError}
                    leftElement={
                      <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                    }
                    rightElement={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#94a3b8" 
                        />
                      </TouchableOpacity>
                    }
                  />

                  <StyledTouchableOpacity 
                    onPress={handleForgotPassword}
                    className="self-end mb-6"
                  >
                    <StyledText className="text-frost-400 font-medium text-sm">
                      Forgot Password?
                    </StyledText>
                  </StyledTouchableOpacity>

                  {/* Enhanced Sign In Button with Ripple Effect */}
                  <StyledView className="relative overflow-hidden rounded-lg">
                    <StyledTouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                      className="bg-gradient-to-r from-frost-500 to-ice-400 px-6 py-4 rounded-lg items-center justify-center shadow-lg"
                      activeOpacity={0.8}
                    >
                      <StyledView className="flex-row items-center">
                        {loading ? (
                          <StyledView className="mr-2">
                            <Ionicons name="refresh" size={20} color="white" />
                          </StyledView>
                        ) : (
                          <StyledView className="mr-2">
                            <Ionicons name="log-in-outline" size={20} color="white" />
                          </StyledView>
                        )}
                        <StyledText className="text-white font-semibold text-lg">
                          {loading ? 'Signing In...' : 'Sign In'}
                        </StyledText>
                      </StyledView>
                    </StyledTouchableOpacity>
                    
                    {/* Ripple Effect */}
                    <AnimatedView 
                      className="absolute inset-0 bg-white/30 rounded-lg"
                      style={rippleAnimatedStyle}
                    />
                  </StyledView>
                </StyledView>
              </Card>
            </AnimatedView>

            {/* Success Animation Overlay */}
            {showSuccess && (
              <AnimatedView 
                className="absolute inset-0 items-center justify-center z-50"
                style={successAnimatedStyle}
              >
                <StyledView className="w-20 h-20 bg-green-500 rounded-full items-center justify-center shadow-2xl">
                  <Ionicons name="checkmark" size={40} color="white" />
                </StyledView>
                <StyledText className="text-white text-lg font-semibold mt-4">
                  Welcome back!
                </StyledText>
              </AnimatedView>
            )}

            {/* Spacer */}
            <StyledView className="h-8" />
            
            {/* Enhanced Social Login */}
            <AnimatedView style={socialAnimatedStyle}>
              <Card variant="ice" className="p-4 mb-6 mt-12">
                <StyledView className="flex-row justify-around">
                  {[
                    { name: 'Google', icon: 'logo-google', color: '#4285F4' },
                    { name: 'Apple', icon: 'logo-apple', color: '#000000' },
                    { name: 'X', icon: 'logo-twitter', color: '#000000' }
                  ].map((provider) => (
                    <TouchableOpacity
                      key={provider.name}
                      className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full items-center justify-center shadow-lg border border-white/20"
                      onPress={() => handleSocialLogin(provider.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={provider.icon as any} size={24} color={provider.color} />
                    </TouchableOpacity>
                  ))}
                </StyledView>
              </Card>
            </AnimatedView>

            {/* Create Account Link */}
            <AnimatedView style={socialAnimatedStyle}>
              <StyledView className="flex-row justify-center mb-8 mt-6">
                <StyledText className="text-ice-300 text-base">
                  Don't have an account?{' '}
                </StyledText>
                <StyledTouchableOpacity 
                  onPress={() => {
                    logger.logButtonPress('Create Account', 'navigate to account creation');
                    onCreateAccount();
                  }}
                  activeOpacity={0.7}
                >
                  <StyledText className="text-frost-400 font-semibold text-base">
                    Create Account
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </AnimatedView>

            {/* Discrete Developer Mode */}
            <AnimatedView style={devModeAnimatedStyle}>
              <StyledView className="flex-row justify-center items-center py-3">
                <StyledTouchableOpacity 
                  onPress={handleDeveloperLogin}
                  className="flex-row items-center opacity-40 hover:opacity-60"
                  activeOpacity={0.6}
                >
                  <Ionicons name="code-slash" size={14} color="#94a3b8" />
                  <StyledText className="text-xs text-ice-400 ml-1 font-medium">
                    Dev Mode
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </AnimatedView>
          </StyledView>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};