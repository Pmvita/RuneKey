import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LiquidGlass } from './LiquidGlass';

export const LiquidGlassDemo: React.FC = () => {
  const handlePress = (message: string) => {
    console.log(`LiquidGlass pressed: ${message}`);
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <Text className="text-3xl font-bold text-white text-center mb-8 mt-4">
        Liquid Glass Demo
      </Text>
      
      {/* Basic Glass Card */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-white mb-3">
          Basic Glass Card
        </Text>
        <LiquidGlass
          className="p-6 bg-white/10"
          cornerRadius={20}
          onPress={() => handlePress('Basic card')}
        >
          <Text className="text-white text-lg font-semibold text-center">
            Touch me for liquid effect!
          </Text>
          <Text className="text-white/70 text-center mt-2">
            Smooth animations with native performance
          </Text>
        </LiquidGlass>
      </View>

      {/* Interactive Button */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-white mb-3">
          Interactive Button
        </Text>
        <LiquidGlass
          className="p-4 bg-blue-500/20"
          cornerRadius={100}
          elasticity={0.25}
          onPress={() => handlePress('Interactive button')}
          enableTilt={true}
          enablePressEffect={true}
        >
          <Text className="text-white text-center font-semibold">
            Press & Tilt Me!
          </Text>
        </LiquidGlass>
      </View>

      {/* High Elasticity Glass */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-white mb-3">
          High Elasticity Glass
        </Text>
        <LiquidGlass
          className="p-6 bg-green-500/20"
          cornerRadius={16}
          elasticity={0.4}
          springConfig={{ damping: 8, stiffness: 100 }}
          onPress={() => handlePress('High elasticity')}
        >
          <Text className="text-white text-center font-semibold">
            Super Bouncy!
          </Text>
          <Text className="text-white/70 text-center mt-2">
            High elasticity for playful interactions
          </Text>
        </LiquidGlass>
      </View>

      {/* Disabled State */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-white mb-3">
          Disabled State
        </Text>
        <LiquidGlass
          className="p-6 bg-gray-500/20"
          cornerRadius={16}
          disabled={true}
        >
          <Text className="text-white/50 text-center font-semibold">
            Disabled Glass
          </Text>
          <Text className="text-white/30 text-center mt-2">
            No interactions when disabled
          </Text>
        </LiquidGlass>
      </View>

      {/* Custom Styling */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-white mb-3">
          Custom Styling
        </Text>
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
          <Text className="text-orange-200 text-center font-semibold">
            Custom Orange Glass
          </Text>
          <Text className="text-orange-200/70 text-center mt-2">
            With custom colors and borders
          </Text>
        </LiquidGlass>
      </View>

      {/* Performance Info */}
      <View className="mb-8 p-4 bg-black/20 rounded-lg">
        <Text className="text-white font-semibold text-center mb-2">
          Performance Features
        </Text>
        <Text className="text-white/70 text-center text-sm">
          • 60fps animations on UI thread{'\n'}
          • Native performance with react-native-reanimated{'\n'}
          • Smooth spring physics{'\n'}
          • Gesture-based interactions{'\n'}
          • Cross-platform compatibility
        </Text>
      </View>
    </ScrollView>
  );
};
