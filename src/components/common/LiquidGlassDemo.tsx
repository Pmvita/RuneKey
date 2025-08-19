import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { LiquidGlass } from './LiquidGlass';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

export const LiquidGlassDemo: React.FC = () => {
  const handlePress = (message: string) => {
    console.log(`LiquidGlass pressed: ${message}`);
  };

  return (
    <StyledScrollView className="flex-1 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <StyledText className="text-3xl font-bold text-white text-center mb-8 mt-4">
        Liquid Glass Demo
      </StyledText>
      
      {/* Basic Glass Card */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-white mb-3">
          Basic Glass Card
        </StyledText>
        <LiquidGlass
          className="p-6 bg-white/10"
          cornerRadius={20}
          onPress={() => handlePress('Basic card')}
        >
          <StyledText className="text-white text-lg font-semibold text-center">
            Touch me for liquid effect!
          </StyledText>
          <StyledText className="text-white/70 text-center mt-2">
            Smooth animations with native performance
          </StyledText>
        </LiquidGlass>
      </StyledView>

      {/* Interactive Button */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-white mb-3">
          Interactive Button
        </StyledText>
        <LiquidGlass
          className="p-4 bg-blue-500/20"
          cornerRadius={100}
          elasticity={0.25}
          onPress={() => handlePress('Interactive button')}
          enableTilt={true}
          enablePressEffect={true}
        >
          <StyledText className="text-white text-center font-semibold">
            Press & Tilt Me!
          </StyledText>
        </LiquidGlass>
      </StyledView>

      {/* High Elasticity Glass */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-white mb-3">
          High Elasticity Glass
        </StyledText>
        <LiquidGlass
          className="p-6 bg-green-500/20"
          cornerRadius={16}
          elasticity={0.4}
          springConfig={{ damping: 8, stiffness: 100 }}
          onPress={() => handlePress('High elasticity')}
        >
          <StyledText className="text-white text-center font-semibold">
            Super Bouncy!
          </StyledText>
          <StyledText className="text-white/70 text-center mt-2">
            High elasticity for playful interactions
          </StyledText>
        </LiquidGlass>
      </StyledView>

      {/* Disabled State */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-white mb-3">
          Disabled State
        </StyledText>
        <LiquidGlass
          className="p-6 bg-gray-500/20"
          cornerRadius={16}
          disabled={true}
        >
          <StyledText className="text-white/50 text-center font-semibold">
            Disabled Glass
          </StyledText>
          <StyledText className="text-white/30 text-center mt-2">
            No interactions when disabled
          </StyledText>
        </LiquidGlass>
      </StyledView>

      {/* Custom Styling */}
      <StyledView className="mb-6">
        <StyledText className="text-lg font-semibold text-white mb-3">
          Custom Styling
        </StyledText>
        <LiquidGlass
          className="p-6"
          cornerRadius={12}
          blurAmount={1.2}
          saturation={1.5}
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
    </StyledScrollView>
  );
};
