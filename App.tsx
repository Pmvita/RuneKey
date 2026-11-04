// Import polyfills first
import './src/utils/polyfills-pre';

// Import react-native-reanimated
import 'react-native-reanimated';

// Initialize react-native-screens early to prevent duplicate registration
import { enableScreens } from 'react-native-screens';
enableScreens(true);

import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons as IoniconSet } from '@expo/vector-icons';
import { useColorScheme, AppRegistry, TouchableOpacity, Image, View, Text, Platform, StyleProp, TextStyle, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from './src/utils/logger';

// Optional haptic feedback
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available, will skip haptic feedback
}

// Screens
import HomeScreen from './src/screens/HomeScreen';
import { SwapScreen } from './src/screens/SwapScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TokenDetailsScreen } from './src/screens/TokenDetailsScreen';
import { SendScreen } from './src/screens/SendScreen';
import { ReceiveScreen } from './src/screens/ReceiveScreen';
import { BuyScreen } from './src/screens/BuyScreen';
import { MarketScreen } from './src/screens/MarketScreen';
import { CoinDetailsScreen } from './src/screens/CoinDetailsScreen';
import { AllocationScreen } from './src/screens/AllocationScreen';
import { InvestingScreen } from './src/screens/InvestingScreen';
import { InvestmentDetailsScreen } from './src/screens/InvestmentDetailsScreen';
import { OnboardingNavigator } from './src/screens/onboarding/OnboardingNavigator';
import { TrendingTokensScreen } from './src/screens/TrendingTokensScreen';

// Hooks
import { useAppStore } from './src/stores/app/useAppStore';
import { useWalletStore } from './src/stores/wallet/useWalletStore';

// Types
import { RootStackParamList } from './src/types';
import { SelectionHighlightProvider } from './src/components';

const TextComponent = Text as any;
const existingTextStyle = TextComponent.defaultProps?.style;
const textColorStyle: TextStyle = { color: '#FFFFFF' };
let newTextStyle: StyleProp<TextStyle>;

if (Array.isArray(existingTextStyle)) {
  newTextStyle = [...existingTextStyle, textColorStyle] as StyleProp<TextStyle>;
} else if (existingTextStyle) {
  newTextStyle = [existingTextStyle, textColorStyle] as StyleProp<TextStyle>;
} else {
  newTextStyle = textColorStyle;
}

TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  style: newTextStyle,
};

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000, // 30 seconds
    },
  },
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppStore();
  const systemColorScheme = useColorScheme();
  const { getThemeColors } = require('./src/utils/theme');
  const colors = getThemeColors(theme, systemColorScheme);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          paddingTop: insets.top + 10,
          height: 85,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </View>
        ),
      }}
    >
      <Tab.Screen 
        name="Wallet" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons 
                name="wallet" 
                size={size} 
                color={focused ? colors.primary : colors.textTertiary} 
              />
            </View>
          ),
          title: 'Wallet',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Exchange" 
        component={SwapScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons 
                name="swap-horizontal" 
                size={size} 
                color={focused ? colors.primary : colors.textTertiary} 
              />
            </View>
          ),
          title: 'Exchange',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Markets" 
        component={MarketScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons 
                name="chart-line" 
                size={size} 
                color={focused ? colors.primary : colors.textTertiary} 
              />
            </View>
          ),
          title: 'Markets',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons 
                name="compass" 
                size={size} 
                color={focused ? colors.primary : colors.textTertiary} 
              />
            </View>
          ),
          title: 'Explore',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons 
                name="cog" 
                size={size} 
                color={focused ? colors.primary : colors.textTertiary} 
              />
            </View>
          ),
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = ({ actualTheme }: { actualTheme: 'light' | 'dark' }) => {
  const { theme } = useAppStore();
  const systemColorScheme = useColorScheme();
  const { getThemeColors } = require('./src/utils/theme');
  const colors = getThemeColors(theme, systemColorScheme);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: actualTheme === 'dark',
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.backgroundCard,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.error,
          },
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={colors.textPrimary === '#F8FAFC' ? 'light' : 'dark'} />
          <TabNavigator />
        </GestureHandlerRootView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

        // Register the root component
        AppRegistry.registerComponent('RuneKey', () => AppNavigator);

        export default AppNavigator;

