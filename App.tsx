// Import polyfills first
import './src/utils/polyfills';

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
import { useColorScheme, AppRegistry, TouchableOpacity, Image, View, Text, Platform, StyleProp, TextStyle } from 'react-native';
import { logger } from './src/utils/logger';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SwapScreen } from './src/screens/SwapScreen';
import { RunekeyScreen } from './src/screens/RunekeyScreen';
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

// Hooks
import { useAppStore } from './src/stores/app/useAppStore';
import { useWalletStore } from './src/stores/wallet/useWalletStore';

// Types
import { RootStackParamList } from './src/types';

const existingTextStyle = Text.defaultProps?.style;
const textColorStyle: TextStyle = { color: '#FFFFFF' };
let newTextStyle: StyleProp<TextStyle>;

if (Array.isArray(existingTextStyle)) {
  newTextStyle = [...existingTextStyle, textColorStyle] as StyleProp<TextStyle>;
} else if (existingTextStyle) {
  newTextStyle = [existingTextStyle, textColorStyle] as StyleProp<TextStyle>;
} else {
  newTextStyle = textColorStyle;
}

Text.defaultProps = {
  ...Text.defaultProps,
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof IoniconSet.glyphMap;

          if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Swap') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Runekey') {
            // Use custom icon for Runekey tab
            return (
              <Image 
                source={require('./assets/icon.png')}
                style={{ 
                  width: size, 
                  height: size,
                  opacity: focused ? 1 : 0.6
                }}
              />
            );
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <IoniconSet name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
        },
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarButton: (props) => {
          const { onPress, ...rest } = props;
          return (
            <TouchableOpacity
              {...rest}
              onPress={(e) => {
                logger.logTabNavigation(route.name);
                onPress?.(e);
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen 
        name="Wallet" 
        component={HomeScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Swap" 
        component={SwapScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Runekey" 
        component={RunekeyScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = ({ actualTheme }: { actualTheme: 'light' | 'dark' }) => {
  return (
    <NavigationContainer
      theme={{
        dark: actualTheme === 'dark',
        colors: {
          primary: '#3B82F6',
          background: '#000000',
          card: '#000000',
          text: '#FFFFFF',
          border: '#1F2937',
          notification: '#EF4444',
        },
      }}
    >
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TokenDetails" 
          component={TokenDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Send" 
          component={SendScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Receive" 
          component={ReceiveScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Buy" 
          component={BuyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Market" 
          component={MarketScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CoinDetails" 
          component={CoinDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Allocation" 
          component={AllocationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Investing" 
          component={InvestingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="InvestmentDetails" 
          component={InvestmentDetailsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
    logger.logError('AppErrorBoundary', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000000' }}>
          <Text style={{ color: '#EF4444', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#3B82F6',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
              Check the browser console for more details
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { theme, isFirstLaunch } = useAppStore();
  const { isConnected } = useWalletStore();
  const systemColorScheme = useColorScheme();
  
  // Determine the actual theme to use - ensure it's always a valid string
  const actualTheme: 'light' | 'dark' = theme === 'system' 
    ? ((systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark')
    : (theme === 'dark' ? 'dark' : 'light');

  // Determine if we should show onboarding - ensure boolean
  const shouldShowOnboarding = Boolean(isFirstLaunch);

  // Set up any initialization logic
  useEffect(() => {
    // Any app initialization can go here
    console.log('RuneKey app started', { platform: Platform.OS });
    
    // Log web-specific info
    if (Platform.OS === 'web') {
      console.log('Running on web platform');
    }
  }, []);

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed, wallet connected:', isConnected);
    // Force a re-render to ensure the app navigates to main screen
    // The stores should have updated the state by now
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
          <SafeAreaProvider>
            {shouldShowOnboarding ? (
              <OnboardingNavigator onComplete={handleOnboardingComplete} />
            ) : (
              <AppNavigator actualTheme={actualTheme} />
            )}
            <StatusBar 
              style="light"
              backgroundColor="#000000"
            />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;