import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlass } from '../components/common/LiquidGlass';
import { useNavigation } from '@react-navigation/native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

export const LiquidGlassTestScreen: React.FC = () => {
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
            Liquid Glass Demo
          </StyledText>
          <StyledText className="text-white/70 text-center">
            Apple's liquid glass effect for React Native
          </StyledText>
        </StyledView>

        {/* Basic Examples */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold text-white mb-4">
            Basic Examples
          </StyledText>
          
          {/* Simple Card */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-6"
              cornerRadius={20}
              onPress={() => handlePress('Simple card')}
            >
              <StyledText className="text-white text-lg font-semibold text-center">
                Simple Glass Card
              </StyledText>
              <StyledText className="text-white/70 text-center mt-2">
                Basic liquid glass effect
              </StyledText>
            </LiquidGlass>
          </StyledView>

          {/* Interactive Button */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-4 bg-blue-500/20"
              cornerRadius={100}
              elasticity={0.25}
              onPress={() => handlePress('Interactive button')}
              enableTilt={true}
            >
              <StyledText className="text-white text-center font-semibold">
                Press & Tilt Me!
              </StyledText>
            </LiquidGlass>
          </StyledView>
        </StyledView>

        {/* Advanced Configurations */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold text-white mb-4">
            Advanced Configurations
          </StyledText>
          
          {/* High Elasticity */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-6 bg-green-500/20"
              cornerRadius={16}
              elasticity={0.4}
              springConfig={{ damping: 8, stiffness: 100 }}
              onPress={() => handlePress('High elasticity')}
            >
              <StyledText className="text-white text-center font-semibold">
                Super Bouncy Glass
              </StyledText>
              <StyledText className="text-white/70 text-center mt-2">
                High elasticity for playful interactions
              </StyledText>
            </LiquidGlass>
          </StyledView>

          {/* Custom Styling */}
          <StyledView className="mb-4">
            <LiquidGlass
              className="p-6"
              cornerRadius={12}
              blurAmount={1.2}
              style={{
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                borderWidth: 2,
                borderColor: 'rgba(255, 165, 0, 0.4)',
              }}
              onPress={() => handlePress('Custom styling')}
            >
              <StyledText className="text-orange-200 text-center font-semibold">
                Custom Orange Glass
              </StyledText>
              <StyledText className="text-orange-200/70 text-center mt-2">
                With custom colors and borders
              </StyledText>
            </LiquidGlass>
          </StyledView>
        </StyledView>

        {/* Use Cases */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold text-white mb-4">
            Use Cases
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
                  Portfolio Value
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

          {/* Action Buttons */}
          <StyledView className="mb-4">
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
            </StyledView>
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
            • Cross-platform compatibility
          </StyledText>
        </StyledView>

        {/* Back to Home */}
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
