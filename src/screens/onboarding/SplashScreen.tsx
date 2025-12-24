import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/app/useAppStore';
import { useWalletStore } from '../../stores/wallet/useWalletStore';
import { UniversalBackground, CustomLoadingAnimation } from '../../components';

interface SplashScreenProps {
  onComplete: (destination: 'onboarding' | 'auth' | 'main') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { isFirstLaunch } = useAppStore();
  const { isConnected } = useWalletStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Determine where to navigate
      if (isFirstLaunch) {
        onComplete('onboarding');
      } else if (!isConnected) {
        onComplete('auth');
      } else {
        onComplete('main');
      }
    };

    initializeApp();
  }, [isFirstLaunch, isConnected, onComplete]);

  return (
    <UniversalBackground>
      <SafeAreaView style={{ flex: 1 }}>
      {/* Icy Blue Gradient Background */}
      <View 
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#0f172a',
        }}
      >
        {/* Animated Background Effects */}
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
          }}
        />
        <View 
          style={{
            position: 'absolute',
            top: 80,
            left: 40,
            width: 128,
            height: 128,
            borderRadius: 64,
            opacity: 0.2,
            backgroundColor: 'rgba(56, 189, 248, 0.3)',
          }}
        />
        <View 
          style={{
            position: 'absolute',
            bottom: 160,
            right: 32,
            width: 96,
            height: 96,
            borderRadius: 48,
            opacity: 0.15,
            backgroundColor: 'rgba(186, 230, 253, 0.4)',
          }}
        />

        {/* App Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32, zIndex: 10 }}>
          <View style={{
            width: 128,
            height: 128,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 64,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 2,
            borderColor: 'rgba(186, 230, 253, 0.4)',
          }}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 80, height: 80 }}
            />
          </View>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#7dd3fc', marginBottom: 12 }}>
            RuneKey
          </Text>
          <Text style={{ fontSize: 18, color: '#bae6fd', textAlign: 'center', opacity: 0.9 }}>
            Your gateway to the decentralized world
          </Text>
        </View>

        {/* Loading Indicator */}
        <View style={{ alignItems: 'center', zIndex: 10 }}>
          <CustomLoadingAnimation
            message="Initializing your wallet..."
            size="large"
            variant="inline"
            spinnerColor="#38bdf8"
          />
        </View>

        {/* Version */}
        <View style={{ position: 'absolute', bottom: 32, zIndex: 10 }}>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </SafeAreaView>
    </UniversalBackground>
  );
};