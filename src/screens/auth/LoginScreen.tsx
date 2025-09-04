import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { logger } from '../../utils/logger';

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
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(80);
  const socialOpacity = useSharedValue(0);
  const socialTranslateY = useSharedValue(40);
  const devModeOpacity = useSharedValue(0);
  const shakeAnimation = useSharedValue(0);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

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

  // Enhanced initial animations
  useEffect(() => {
    // Logo animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120 });

    // Staggered form animation
    setTimeout(() => {
      formOpacity.value = withTiming(1, { duration: 600 });
      formTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, 300);

    // Social buttons animation
    setTimeout(() => {
      socialOpacity.value = withTiming(1, { duration: 600 });
      socialTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, 500);

    // Dev mode animation
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

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Enhanced background gradient */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0f172a',
      }} />

      {/* Subtle particle effect overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.2 }}>
        <View style={{ position: 'absolute', top: 100, left: 40, width: 8, height: 8, backgroundColor: '#38bdf8', borderRadius: 4 }} />
        <View style={{ position: 'absolute', top: 200, right: 80, width: 6, height: 6, backgroundColor: '#94a3b8', borderRadius: 3 }} />
        <View style={{ position: 'absolute', bottom: 200, left: 80, width: 10, height: 10, backgroundColor: '#7dd3fc', borderRadius: 5 }} />
        <View style={{ position: 'absolute', bottom: 100, right: 40, width: 4, height: 4, backgroundColor: '#38bdf8', borderRadius: 2 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: isKeyboardVisible ? 100 : 0
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}>
            {/* Enhanced App Logo */}
            <Animated.View style={[{ alignItems: 'center', marginBottom: 48 }, logoAnimatedStyle]}>
              <View style={{
                width: 112,
                height: 112,
                backgroundColor: '#38bdf8',
                borderRadius: 56,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}>
                <View style={{
                  width: 96,
                  height: 96,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 64, height: 64 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Animated.Text style={{
                fontSize: 40,
                fontWeight: 'bold',
                color: '#f1f5f9',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                Welcome Back
              </Animated.Text>
              <Animated.Text style={{
                fontSize: 18,
                color: '#cbd5e1',
                textAlign: 'center',
                lineHeight: 28,
                maxWidth: 280,
              }}>
                Sign in to your RuneKey account to continue
              </Animated.Text>
            </Animated.View>

            {/* Enhanced Login Form */}
            <Animated.View style={[formAnimatedStyle, shakeAnimatedStyle]}>
              <Card variant="frost">
                <View style={{ gap: 24, padding: 8 }}>
                  <Input
                    label="Email Address"
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={emailError}
                    leftElement={
                      <Ionicons name="mail-outline" size={20} color="#64748b" />
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
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                    }
                    rightElement={
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ padding: 8, borderRadius: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                    }
                  />

                  <TouchableOpacity 
                    onPress={handleForgotPassword}
                    style={{ alignSelf: 'flex-end', marginBottom: 8 }}
                  >
                    <Text style={{ color: '#38bdf8', fontWeight: '500', fontSize: 14 }}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  {/* Enhanced Sign In Button */}
                  <View style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                      style={{
                        backgroundColor: '#0ea5e9',
                        paddingHorizontal: 32,
                        paddingVertical: 20,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {loading ? (
                          <View style={{ marginRight: 12 }}>
                            <Ionicons name="refresh" size={24} color="white" />
                          </View>
                        ) : (
                          <View style={{ marginRight: 12 }}>
                            <Ionicons name="log-in-outline" size={24} color="white" />
                          </View>
                        )}
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>
                          {loading ? 'Signing In...' : 'Sign In'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Success Animation Overlay */}
            {showSuccess && (
              <Animated.View 
                style={[{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 50,
                }, successAnimatedStyle]}
              >
                <View style={{
                  width: 96,
                  height: 96,
                  backgroundColor: '#10b981',
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}>
                  <Ionicons name="checkmark" size={48} color="white" />
                </View>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 24 }}>
                  Welcome back!
                </Text>
                <Text style={{ color: '#cbd5e1', fontSize: 18, marginTop: 8 }}>
                  Redirecting to your dashboard...
                </Text>
              </Animated.View>
            )}

            {/* Enhanced Social Login */}
            <Animated.View style={[socialAnimatedStyle, { marginTop: 24 }]}>
              <Card variant="ice">
                <Text style={{ color: '#cbd5e1', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
                  Or continue with
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[
                    { name: 'Google', icon: 'logo-google', color: '#4285F4' },
                    { name: 'Apple', icon: 'logo-apple', color: '#FFFFFF' },
                    { name: 'X', icon: 'logo-twitter', color: '#FFFFFF' }
                  ].map((provider) => (
                    <TouchableOpacity
                      key={provider.name}
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      }}
                      onPress={() => handleSocialLogin(provider.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={provider.icon as any} size={28} color={provider.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            </Animated.View>

            {/* Enhanced Create Account Link */}
            <Animated.View style={socialAnimatedStyle}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 18 }}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    logger.logButtonPress('Create Account', 'navigate to account creation');
                    onCreateAccount();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 18 }}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Enhanced Developer Mode */}
            <Animated.View style={devModeAnimatedStyle}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 }}>
                <TouchableOpacity 
                  onPress={handleDeveloperLogin}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: 0.5,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="code-slash" size={16} color="#94a3b8" />
                  <Text style={{ color: '#cbd5e1', fontSize: 14, fontWeight: '500', marginLeft: 8 }}>
                    Developer Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};