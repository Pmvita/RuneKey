import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);

export const RunekeyScreen: React.FC = () => {
  // Log screen focus
  useFocusEffect(
    React.useCallback(() => {
      logger.logScreenFocus('RunekeyScreen');
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Background overlay */}
      <StyledView 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgb(93,138,168)' }}
      />
      
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="p-6">
          <StyledView className="flex-row items-center mb-4">
            <StyledImage 
              source={require('../../assets/icon.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
            />
            <StyledView>
              <StyledText className="text-2xl font-bold text-slate-900">
                Runekey
              </StyledText>
              <StyledText className="text-slate-600">
                Your Digital Identity
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Main Content */}
        <StyledView className="px-6 mb-6">
          <StyledView className="p-6 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
            <StyledView className="items-center mb-6">
              <StyledImage 
                source={require('../../assets/icon.png')}
                style={{ width: 80, height: 80, marginBottom: 16 }}
              />
              <StyledText className="text-xl font-bold text-slate-900 mb-2">
                Welcome to Runekey
              </StyledText>
              <StyledText className="text-slate-600 text-center">
                Your secure digital wallet for the modern world
              </StyledText>
            </StyledView>

            {/* Features */}
            <StyledView className="space-y-4">
              <StyledView className="flex-row items-center p-4 bg-white rounded-lg">
                <StyledView className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="font-semibold text-slate-900">
                    Secure & Private
                  </StyledText>
                  <StyledText className="text-sm text-slate-600">
                    Your keys, your crypto, your control
                  </StyledText>
                </StyledView>
              </StyledView>

              <StyledView className="flex-row items-center p-4 bg-white rounded-lg">
                <StyledView className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="flash" size={20} color="#22c55e" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="font-semibold text-slate-900">
                    Lightning Fast
                  </StyledText>
                  <StyledText className="text-sm text-slate-600">
                    Instant transactions and real-time updates
                  </StyledText>
                </StyledView>
              </StyledView>

              <StyledView className="flex-row items-center p-4 bg-white rounded-lg">
                <StyledView className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="globe" size={20} color="#8b5cf6" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="font-semibold text-slate-900">
                    Multi-Chain Support
                  </StyledText>
                  <StyledText className="text-sm text-slate-600">
                    Ethereum, Polygon, BSC and more
                  </StyledText>
                </StyledView>
              </StyledView>

              <StyledView className="flex-row items-center p-4 bg-white rounded-lg">
                <StyledView className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="trending-up" size={20} color="#f97316" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="font-semibold text-slate-900">
                    Live Market Data
                  </StyledText>
                  <StyledText className="text-sm text-slate-600">
                    Real-time prices and portfolio tracking
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Stats Section */}
        <StyledView className="px-6 mb-6">
          <StyledText className="text-lg font-semibold text-slate-900 mb-4">
            App Statistics
          </StyledText>
          
          <StyledView className="space-y-3">
            <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row justify-between items-center">
                <StyledText className="text-slate-600">Total Transactions</StyledText>
                <StyledText className="text-slate-900 font-semibold">
                  1,247
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row justify-between items-center">
                <StyledText className="text-slate-600">Supported Networks</StyledText>
                <StyledText className="text-slate-900 font-semibold">
                  5
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView className="p-4 border border-gray-200 shadow-lg backdrop-blur-sm rounded-xl" style={{ backgroundColor: '#e8eff3' }}>
              <StyledView className="flex-row justify-between items-center">
                <StyledText className="text-slate-600">Security Score</StyledText>
                <StyledText className="text-slate-900 font-semibold">
                  98/100
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Additional Space */}
        <StyledView className="h-6" />
      </StyledScrollView>
    </SafeAreaView>
  );
}; 