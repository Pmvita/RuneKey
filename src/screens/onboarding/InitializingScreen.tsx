import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface InitializingScreenProps {
  onComplete: () => void;
}

export const InitializingScreen: React.FC<InitializingScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Simulate initialization process
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Animated background elements */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
        }}
      />
      
      {/* Floating background circles */}
      <View 
        style={{
          position: 'absolute',
          width: 384,
          height: 384,
          borderRadius: 192,
          opacity: 0.1,
          top: -150,
          left: -100,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
        }}
      />
      <View 
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: 160,
          opacity: 0.15,
          bottom: -120,
          right: -80,
          backgroundColor: 'rgba(186, 230, 253, 0.1)',
        }}
      />

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#7dd3fc', marginBottom: 8 }}>
          Initializing Wallet
        </Text>
        <Text style={{ fontSize: 18, color: '#94a3b8', textAlign: 'center', marginBottom: 32 }}>
          Setting up your secure environment...
        </Text>
        
        <ActivityIndicator size="large" color="#38bdf8" />
        
        <View style={{ marginTop: 32, gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
            • Establishing secure connection
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
            • Loading blockchain networks
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
            • Preparing wallet interface
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};