import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlass } from '../components/common/LiquidGlass';
import { useNavigation } from '@react-navigation/native';

export const LiquidGlassTestScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handlePress = (message: string) => {
    console.log(`🎯 ANIMATION: LiquidGlass pressed - ${message}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-4 p-2"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-white text-center mb-2">
            Liquid Glass Demo
          </Text>
          <Text className="text-white/70 text-center">
            Apple's liquid glass effect for React Native
          </Text>
        </View>

        {/* Basic Examples */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-white mb-4">
            Basic Examples
          </Text>
          
          {/* Simple Card */}
          <View className="mb-4">
            <LiquidGlass
              className="p-6"
              cornerRadius={20}
              onPress={() => handlePress('Simple card')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Simple Glass Card
              </Text>
              <Text className="text-white/70 text-center mt-2">
                Basic liquid glass effect
              </Text>
            </LiquidGlass>
          </View>

          {/* Interactive Button */}
          <View className="mb-4">
            <LiquidGlass
              className="p-4 bg-blue-500/20"
              cornerRadius={100}
              elasticity={0.25}
              onPress={() => handlePress('Interactive button')}
              enableTilt={true}
            >
              <Text className="text-white text-center font-semibold">
                Press & Tilt Me!
              </Text>
            </LiquidGlass>
          </View>
        </View>

        {/* Advanced Configurations */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-white mb-4">
            Advanced Configurations
          </Text>
          
          {/* High Elasticity */}
          <View className="mb-4">
            <LiquidGlass
              className="p-6 bg-green-500/20"
              cornerRadius={16}
              elasticity={0.4}
              springConfig={{ damping: 8, stiffness: 100 }}
              onPress={() => handlePress('High elasticity')}
            >
              <Text className="text-white text-center font-semibold">
                Super Bouncy Glass
              </Text>
              <Text className="text-white/70 text-center mt-2">
                High elasticity for playful interactions
              </Text>
            </LiquidGlass>
          </View>

          {/* Custom Styling */}
          <View className="mb-4">
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
              <Text className="text-orange-200 text-center font-semibold">
                Custom Orange Glass
              </Text>
              <Text className="text-orange-200/70 text-center mt-2">
                With custom colors and borders
              </Text>
            </LiquidGlass>
          </View>
        </View>

        {/* Use Cases */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-white mb-4">
            Use Cases
          </Text>
          
          {/* Portfolio Card */}
          <View className="mb-4">
            <LiquidGlass
              className="p-6 bg-white/10"
              cornerRadius={20}
              elasticity={0.2}
              onPress={() => handlePress('Portfolio card')}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white/80 text-sm">
                  Portfolio Value
                </Text>
                <Text className="text-green-400 text-sm">
                  +2.5%
                </Text>
              </View>
              <Text className="text-white text-2xl font-bold">
                $15,500.00
              </Text>
            </LiquidGlass>
          </View>

          {/* Action Buttons */}
          <View className="mb-4">
            <View className="flex-row justify-around">
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
            </View>
          </View>
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

        {/* Back to Home */}
        <View className="mb-8">
          <LiquidGlass
            className="p-4 bg-white/10"
            cornerRadius={16}
            onPress={() => navigation.navigate('Home')}
          >
            <Text className="text-white text-center font-semibold">
              Back to Home
            </Text>
          </LiquidGlass>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
