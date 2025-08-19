import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlass } from './LiquidGlass';
import { useNavigation } from '@react-navigation/native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

export const LiquidGlassShowcaseScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handlePress = (message: string) => {
    console.log(`🎯 ANIMATION: LiquidGlass pressed - ${message}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <StyledScrollView className="flex-1 p-4">
        {/* Header */}
        <StyledView className="mb-8">
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-4 p-2"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </StyledTouchableOpacity>
          
          <StyledText className="text-3xl font-bold text-white text-center mb-2">
            Liquid Glass Showcase
          </StyledText>
          <StyledText className="text-white/70 text-center">
            Beautiful liquid glass effects throughout RuneKey
          </StyledText>
        </StyledView>

        {/* HomeScreen Examples */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold text-white mb-4">
            🏠 HomeScreen Effects
          </StyledText>
          
          {/* Portfolio Card */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-6 bg-white/10"
              cornerRadius={20}
              elasticity={0.2}
              onPress={() => handlePress('Portfolio card')}
            >
              <StyledView className="flex-row justify-between items-center mb-2">
                <StyledText className="text-white/80 text-sm">
                  Total Portfolio Value
                </StyledText>
                <StyledText className="text-green-400 text-sm">
                  +2.5%
                </StyledText>
              </StyledView>
              <StyledText className="text-white text-2xl font-bold">
                $15,500.00
              </StyledText>
            </LiquidGlass>
          </StyledView>

          {/* Quick Actions */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-6"
              cornerRadius={20}
              elasticity={0.15}
              blurAmount={0.8}
            >
              <StyledView className="flex-row justify-around">
                <LiquidGlass
                  className="w-16 h-16 bg-red-500/20 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => handlePress('Send button')}
                >
                  <Ionicons name="arrow-up" size={24} color="#ef4444" />
                </LiquidGlass>
                
                <LiquidGlass
                  className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => handlePress('Receive button')}
                >
                  <Ionicons name="arrow-down" size={24} color="#22c55e" />
                </LiquidGlass>
                
                <LiquidGlass
                  className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => handlePress('Swap button')}
                >
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                </LiquidGlass>
                
                <LiquidGlass
                  className="w-16 h-16 bg-yellow-500/20 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => handlePress('Buy button')}
                >
                  <Ionicons name="card" size={24} color="#eab308" />
                </LiquidGlass>
              </StyledView>
            </LiquidGlass>
          </StyledView>
        </StyledView>

        {/* SwapScreen Examples */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold text-white mb-4">
            🔄 SwapScreen Effects
          </StyledText>
          
          {/* Swap Button */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-2"
              cornerRadius={100}
              elasticity={0.3}
              onPress={() => handlePress('Swap tokens button')}
            >
              <Ionicons name="swap-vertical" size={20} color="#3B82F6" />
            </LiquidGlass>
          </StyledView>

          {/* Quote Info */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-4"
              cornerRadius={16}
              elasticity={0.15}
              blurAmount={0.6}
            >
              <StyledView className="space-y-2">
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-white/80 text-sm">Exchange Rate</StyledText>
                  <StyledText className="text-white text-sm font-medium">
                    1 ETH = 2,650.45 USDC
                  </StyledText>
                </StyledView>
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-white/80 text-sm">Price Impact</StyledText>
                  <StyledText className="text-green-400 text-sm font-medium">0.12%</StyledText>
                </StyledView>
              </StyledView>
            </LiquidGlass>
          </StyledView>

          {/* Main Swap Button */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="w-full py-3 px-4 bg-blue-600/20"
              cornerRadius={16}
              elasticity={0.2}
              onPress={() => handlePress('Execute swap')}
            >
              <StyledText className="text-blue-200 text-center font-semibold">
                Swap
              </StyledText>
            </LiquidGlass>
          </StyledView>
        </StyledView>

        {/* Performance Info */}
        <StyledView className="mb-8 p-4 bg-black/20 rounded-lg">
          <StyledText className="text-white font-semibold text-center mb-2">
            Performance Features
          </StyledText>
          <StyledText className="text-white/70 text-center text-sm">
            • 60fps animations on UI thread{'\n'}
            • Native performance with react-native-reanimated{'\n'}
            • Smooth spring physics{'\n'}
            • Gesture-based interactions{'\n'}
            • Cross-platform compatibility{'\n'}
            • Integrated throughout the entire app
          </StyledText>
        </StyledView>

        {/* Navigation */}
        <StyledView className="mb-8">
          <LiquidGlass
            className="p-4 bg-white/10"
            cornerRadius={16}
            onPress={() => navigation.navigate('Home')}
          >
            <StyledText className="text-white text-center font-semibold">
              Back to Home
            </StyledText>
          </LiquidGlass>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};
