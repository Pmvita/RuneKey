// Import polyfills first
import './src/utils/polyfills';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, AppRegistry, TouchableOpacity } from 'react-native';
import { logger } from './src/utils/logger';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SwapScreen } from './src/screens/SwapScreen';
import { RecentActivityScreen } from './src/screens/RecentActivityScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WalletScreen } from './src/screens/WalletScreen';
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
          } else if (route.name === 'Recent Activity') {
            iconName = focused ? 'time' : 'time-outline';
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
        name="Recent Activity" 
        component={RecentActivityScreen}
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
      <TabNavigator />
    </NavigationContainer>
  );
};

function App() {
  const { theme, isFirstLaunch } = useAppStore();
  const { isConnected } = useWalletStore();
  const systemColorScheme = useColorScheme();
  
  // Determine the actual theme to use
  const actualTheme = theme === 'system' ? systemColorScheme : theme;

  // Determine if we should show onboarding
  const shouldShowOnboarding = isFirstLaunch || !isConnected;

  // Set up any initialization logic
  useEffect(() => {
    // Any app initialization can go here
    console.log('RuneKey app started');
  }, []);

  const handleOnboardingComplete = () => {
    // Onboarding completion is handled by the stores themselves
    // This component will automatically re-render when the state changes
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