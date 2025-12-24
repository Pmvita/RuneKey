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
import { HomeScreen } from './src/screens/HomeScreen';
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
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof IoniconSet.glyphMap;
          let label = '';

          if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
            label = 'Wallet';
          } else if (route.name === 'Stocks') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
            label = 'Stocks';
          } else if (route.name === 'Runekey') {
            const scaledSize = 56;
            return (
              <View style={styles.centerTabWrapper}>
                <View style={[styles.centerTabGlow, focused && styles.centerTabGlowFocused]} />
                <View style={[styles.centerTabButton, focused && styles.centerTabButtonFocused]}>
                  <Image
                    source={require('./assets/icon.png')}
                    style={[
                      styles.runekeyIconLarge,
                      {
                        width: scaledSize,
                        height: scaledSize,
                        opacity: focused ? 1 : 0.85,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            label = 'Search';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
            label = 'Settings';
          } else {
            iconName = 'ellipse-outline';
          }

          if (route.name === 'Runekey') {
            return null;
          }

          return (
            <View style={styles.tabIconContainer}>
              <View style={[styles.tabIconWrapper, focused && styles.tabIconFocused]}>
                <IoniconSet 
                  name={iconName} 
                  size={focused ? 24 : 22} 
                  color={focused ? '#FFFFFF' : '#94A3B8'} 
                />
              </View>
              {focused && (
                <Text 
                  style={styles.tabLabel}
                  numberOfLines={1}
                  accessibilityLabel={label}
                >
                  {label}
                </Text>
              )}
            </View>
          );
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundWrapper}>
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.85)', 'rgba(2, 6, 23, 0.95)', 'rgba(0, 0, 0, 0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabBarGradient}
            />
            <View style={styles.tabBarBlurOverlay} />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: Math.max(insets.bottom, Platform.select({ ios: 20, android: 16, default: 20 })),
            paddingBottom: Math.max(insets.bottom, Platform.select({ ios: 8, android: 8, default: 8 })),
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarButton: (props) => {
          const { onPress, style, accessibilityLabel, accessibilityRole, ...rest } = props;
          const scaleAnim = React.useRef(new Animated.Value(1)).current;
          
          const handlePress = (e: any) => {
            // Haptic feedback for better UX (if available)
            if (Platform.OS !== 'web' && Haptics) {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {
                // Haptics not available, continue without feedback
              }
            }
            
            // Scale animation
            Animated.sequence([
              Animated.spring(scaleAnim, {
                toValue: 0.9,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }),
            ]).start();
            
            logger.logTabNavigation(route.name);
            onPress?.(e);
          };
          
          return (
            <Animated.View
              style={[
                style,
                styles.tabButton,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <TouchableOpacity
                {...rest}
                onPress={handlePress}
                activeOpacity={0.7}
                accessibilityLabel={accessibilityLabel || route.name}
                accessibilityRole={accessibilityRole || 'button'}
                accessibilityState={{ selected: props.accessibilityState?.selected }}
                style={styles.tabButtonInner}
              />
            </Animated.View>
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
        name="Stocks" 
        component={MarketScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Runekey" 
        component={ExploreScreen}
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
          name="Swap" 
          component={SwapScreen}
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
        <Stack.Screen 
          name="TrendingTokens" 
          component={TrendingTokensScreen}
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
          <SelectionHighlightProvider>
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
          </SelectionHighlightProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: Platform.select({ ios: 80, android: 76, default: 78 }),
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 32,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    // Enhanced shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  tabBarBackgroundWrapper: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    // Glassmorphism effect
    ...Platform.select({
      web: {
        // @ts-ignore web-only style
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      },
      default: {},
    }),
  },
  tabBarGradient: {
    flex: 1,
  },
  tabBarBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 32,
  },
  tabBarItem: {
    borderRadius: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minWidth: 48,
    minHeight: 48,
  },
  tabIconFocused: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: Platform.select({ ios: -24, android: -20, default: -22 }) }],
  },
  centerTabGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    opacity: 0.7,
    ...Platform.select({
      web: { 
        // @ts-ignore web-only style
        filter: 'blur(28px)',
      },
      default: {},
    }),
  },
  centerTabGlowFocused: {
    backgroundColor: 'rgba(96, 165, 250, 0.4)',
    opacity: 0.9,
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  centerTabButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(2, 6, 23, 0.98)',
    borderWidth: 2.5,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  centerTabButtonFocused: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    shadowOpacity: 0.6,
    shadowRadius: 28,
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#60A5FA',
        shadowOpacity: 0.7,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  runekeyIconLarge: {
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});