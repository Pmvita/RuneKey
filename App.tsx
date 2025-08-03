// Import polyfills first
import './src/utils/polyfills';

// Reanimated removed - using pure React animations

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, AppRegistry, TouchableOpacity, Image } from 'react-native';
import { logger } from './src/utils/logger';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SwapScreen } from './src/screens/SwapScreen';
import { RunekeyScreen } from './src/screens/RunekeyScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TokenDetailsScreen } from './src/screens/TokenDetailsScreen';
import { SendScreen } from './src/screens/SendScreen';
import { OnboardingNavigator } from './src/screens/onboarding/OnboardingNavigator';

// Hooks
import { useAppStore } from './src/stores/app/useAppStore';
import { useWalletStore } from './src/stores/wallet/useWalletStore';

// Types
import { RootStackParamList } from './src/types';

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
  const colorScheme = useColorScheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
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
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc',
        },
        headerTintColor: colorScheme === 'dark' ? '#f1f5f9' : '#0f172a',
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
          background: actualTheme === 'dark' ? '#111827' : '#F9FAFB',
          card: actualTheme === 'dark' ? '#1F2937' : '#FFFFFF',
          text: actualTheme === 'dark' ? '#F9FAFB' : '#111827',
          border: actualTheme === 'dark' ? '#374151' : '#E5E7EB',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function App() {
  const { theme, isFirstLaunch } = useAppStore();
  const { isConnected } = useWalletStore();
  const systemColorScheme = useColorScheme();
  
  // Determine the actual theme to use
  const actualTheme = theme === 'system' ? (systemColorScheme || 'light') : theme;

  // Determine if we should show onboarding
  const shouldShowOnboarding = isFirstLaunch || !isConnected;

  // Set up any initialization logic
  useEffect(() => {
    // Any app initialization can go here
    console.log('RuneKey app started');
  }, []);

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed, wallet connected:', isConnected);
    // Force a re-render to ensure the app navigates to main screen
    // The stores should have updated the state by now
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {shouldShowOnboarding ? (
            <OnboardingNavigator onComplete={handleOnboardingComplete} />
          ) : (
            <AppNavigator actualTheme={actualTheme} />
          )}
          <StatusBar 
            style={actualTheme === 'dark' ? 'light' : 'dark'} 
            backgroundColor={actualTheme === 'dark' ? '#111827' : '#F9FAFB'}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;