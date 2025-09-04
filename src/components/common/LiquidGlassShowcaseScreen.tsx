import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlass } from './LiquidGlass';
import { useNavigation } from '@react-navigation/native';

export const LiquidGlassShowcaseScreen: React.FC = () => {
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
            Liquid Glass Showcase
          </Text>
          <Text className="text-white/70 text-center">
            Beautiful liquid glass effects throughout RuneKey
          </Text>
        </View>

        {/* HomeScreen Examples */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-white mb-4">
            🏠 HomeScreen Effects
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
                  Total Portfolio Value
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

          {/* Quick Actions */}
          <View className="mb-4">
            <LiquidGlass
              className="p-6"
              cornerRadius={20}
              elasticity={0.15}
              blurAmount={0.8}
            >
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
                
                <LiquidGlass
                  className="w-16 h-16 bg-yellow-500/20 rounded-full items-center justify-center"
                  cornerRadius={100}
                  elasticity={0.3}
                  onPress={() => handlePress('Buy button')}
                >
                  <Ionicons name="card" size={24} color="#eab308" />
                </LiquidGlass>
              </View>
            </LiquidGlass>
          </View>
        </View>

        {/* SwapScreen Examples */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-white mb-4">
            🔄 SwapScreen Effects
          </Text>
          
          {/* Swap Button */}
          <View className="mb-4">
            <LiquidGlass
              className="p-2"
              cornerRadius={100}
              elasticity={0.3}
              onPress={() => handlePress('Swap tokens button')}
            >
              <Ionicons name="swap-vertical" size={20} color="#3B82F6" />
            </LiquidGlass>
          </View>

          {/* Quote Info */}
          <View className="mb-4">
            <LiquidGlass
              className="p-4"
              cornerRadius={16}
              elasticity={0.15}
              blurAmount={0.6}
            >
              <View className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/80 text-sm">Exchange Rate</Text>
                  <Text className="text-white text-sm font-medium">
                    1 ETH = 2,650.45 USDC
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/80 text-sm">Price Impact</Text>
                  <Text className="text-green-400 text-sm font-medium">0.12%</Text>
                </View>
              </View>
            </LiquidGlass>
          </View>

          {/* Main Swap Button */}
          <View className="mb-4">
            <LiquidGlass
              className="w-full py-3 px-4 bg-blue-600/20"
              cornerRadius={16}
              elasticity={0.2}
              onPress={() => handlePress('Execute swap')}
            >
              <Text className="text-blue-200 text-center font-semibold">
                Swap
              </Text>
            </LiquidGlass>
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
            • Cross-platform compatibility{'\n'}
            • Integrated throughout the entire app
          </Text>
        </View>

        {/* Navigation */}
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
