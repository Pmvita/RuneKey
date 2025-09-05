import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';
import { UniversalBackground } from '../components';

export const RunekeyScreen: React.FC = () => {
  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('RunekeyScreen');
    }, [])
  );

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
      {/* Background overlay */}
      <View 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgb(93,138,168)' }}
      />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6">
          <View className="flex-row items-center mb-4">
            <Image 
              source={require('../../assets/icon.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
            />
            <View>
              <Text className="text-2xl font-bold text-slate-900">
                Runekey
              </Text>
              <Text className="text-slate-600">
                Your Digital Identity
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-6 mb-6">
          <View className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <View className="items-center mb-6">
              <Image 
                source={require('../../assets/icon.png')}
                style={{ width: 80, height: 80, marginBottom: 16 }}
              />
              <Text className="text-xl font-bold text-slate-900 mb-2">
                Welcome to Runekey
              </Text>
              <Text className="text-slate-600 text-center">
                Your secure digital wallet for the modern world
              </Text>
            </View>

            {/* Features */}
            <View className="space-y-4">
              <View className="flex-row items-center p-4 bg-white rounded-lg">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    Secure & Private
                  </Text>
                  <Text className="text-sm text-slate-600">
                    Your keys, your crypto, your control
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-4 bg-white rounded-lg">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="flash" size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    Lightning Fast
                  </Text>
                  <Text className="text-sm text-slate-600">
                    Instant transactions and real-time updates
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-4 bg-white rounded-lg">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="globe" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    Multi-Chain Support
                  </Text>
                  <Text className="text-sm text-slate-600">
                    Ethereum, Polygon, BSC and more
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-4 bg-white rounded-lg">
                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="trending-up" size={20} color="#f97316" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    Live Market Data
                  </Text>
                  <Text className="text-sm text-slate-600">
                    Real-time prices and portfolio tracking
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">
            App Statistics
          </Text>
          
          <View className="space-y-3">
            <View className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-600">Total Transactions</Text>
                <Text className="text-slate-900 font-semibold">
                  1,247
                </Text>
              </View>
            </View>

            <View className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-600">Supported Networks</Text>
                <Text className="text-slate-900 font-semibold">
                  5
                </Text>
              </View>
            </View>

            <View className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-600">Security Score</Text>
                <Text className="text-slate-900 font-semibold">
                  98/100
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Space */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
    </UniversalBackground>
  );
};