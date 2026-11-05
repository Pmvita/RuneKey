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
// Deep import avoids Hermes "Property 'MaterialCommunityIcons' doesn't exist"
// from @expo/vector-icons lazy barrel getters under Metro inlineRequires.
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme, AppRegistry, TouchableOpacity, Image, View, Text, Platform, StyleProp, TextStyle, StyleSheet, Animated } from 'react-native';
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

const TAB_ICON_SIZE = 24;
const TAB_BAR_CONTENT_HEIGHT = 56;

type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TabBarIcon = ({
  name,
  color,
}: {
  name: TabIconName;
  color: string;
}) => (
  <View
    style={{
      width: TAB_ICON_SIZE + 4,
      height: TAB_ICON_SIZE + 4,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    }}
  >
    <MaterialCommunityIcons name={name} size={TAB_ICON_SIZE} color={color} />
  </View>
);

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppStore();
  const systemColorScheme = useColorScheme();
  const { getThemeColors } = require('./src/utils/theme');
  const colors = getThemeColors(theme, systemColorScheme);

  // Web often reports ~0 bottom inset; keep a usable pad so icons/labels aren't clipped.
  // Native: React Navigation also applies safe-area — use the real inset once via paddingBottom + height.
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 8 : 0
  );
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.borderDark,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: bottomInset,
          paddingHorizontal: 8,
          height: tabBarHeight,
          minHeight: tabBarHeight,
          overflow: 'visible',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          overflow: 'visible',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: 2,
          marginBottom: Platform.OS === 'web' ? 2 : 0,
        },
        // Stronger inactive contrast than textTertiary (#94A3B8) on white.
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Solid surface — brand gradient behind icons washed out labels/icons on web.
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: colors.backgroundSecondary,
              borderTopWidth: 1,
              borderTopColor: colors.borderDark,
            }}
          />
        ),
      }}
    >
      <Tab.Screen
        name="Wallet"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
          title: 'Wallet',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Exchange"
        component={SwapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="swap-horizontal" color={color} />
          ),
          title: 'Exchange',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chart-line" color={color} />
          ),
          title: 'Markets',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
          title: 'Explore',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
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

