# LiquidGlass Component Guide

## Overview

The `LiquidGlass` component is a custom implementation of Apple's liquid glass effect for React Native, built using `react-native-reanimated` for smooth 60fps animations and native performance.

## Features

- **Smooth Animations**: 60fps animations running on the UI thread
- **Interactive Effects**: Press, tilt, and hover animations
- **Customizable**: Configurable elasticity, blur, and styling
- **Cross-Platform**: Works on both iOS and Android
- **Performance Optimized**: Uses react-native-reanimated for native performance

## Installation

The component is already included in your project. Make sure you have the required dependencies:

```bash
# Already installed in your project
npm install react-native-reanimated
npm install react-native-gesture-handler
```

## Basic Usage

```tsx
import { LiquidGlass } from '../components';

// Simple glass card
<LiquidGlass
  className="p-6"
  cornerRadius={20}
  onPress={() => console.log('Pressed!')}
>
  <Text>Your content here</Text>
</LiquidGlass>
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Content to render inside the glass |
| `onPress` | `() => void` | - | Press handler function |
| `disabled` | `boolean` | `false` | Whether the component is disabled |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `ViewStyle` | - | Additional inline styles |

### Glass Effect Customization

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `blurAmount` | `number` | `0.8` | Blur intensity (0.1 - 2.0) |
| `saturation` | `number` | `1.2` | Color saturation (0.5 - 2.0) |
| `elasticity` | `number` | `0.15` | Elastic feel (0 = rigid, 1 = very elastic) |
| `cornerRadius` | `number` | `16` | Border radius in pixels |

### Animation Settings

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animationDuration` | `number` | `300` | Animation duration in milliseconds |
| `springConfig` | `object` | `{ damping: 15, stiffness: 150 }` | Spring physics configuration |

### Interactive Effects

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableTilt` | `boolean` | `true` | Enable tilt effect on touch |
| `enablePressEffect` | `boolean` | `true` | Enable press animations |
| `enableHoverEffect` | `boolean` | `true` | Enable hover-like effects |

## Examples

### 1. Portfolio Card

```tsx
<LiquidGlass
  className="p-6"
  cornerRadius={20}
  elasticity={0.2}
  blurAmount={1.0}
  onPress={() => handlePortfolioPress()}
>
  <View className="flex-row justify-between items-center mb-2">
    <Text className="text-sm text-slate-600">Portfolio Value</Text>
    <Text className="text-green-400 text-sm">+2.5%</Text>
  </View>
  <Text className="text-2xl font-bold">$15,500.00</Text>
</LiquidGlass>
```

### 2. Interactive Button

```tsx
<LiquidGlass
  className="p-4 bg-blue-500/20"
  cornerRadius={100}
  elasticity={0.25}
  onPress={() => handleButtonPress()}
  enableTilt={true}
>
  <Text className="text-white font-semibold">Press & Tilt Me!</Text>
</LiquidGlass>
```

### 3. High Elasticity Glass

```tsx
<LiquidGlass
  className="p-6 bg-green-500/20"
  cornerRadius={16}
  elasticity={0.4}
  springConfig={{ damping: 8, stiffness: 100 }}
  onPress={() => handlePress()}
>
  <Text className="text-white font-semibold">Super Bouncy!</Text>
</LiquidGlass>
```

### 4. Custom Styling

```tsx
<LiquidGlass
  className="p-6"
  cornerRadius={12}
  blurAmount={1.2}
  style={{
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 165, 0, 0.4)',
  }}
  onPress={() => handlePress()}
>
  <Text className="text-orange-200 font-semibold">Custom Orange Glass</Text>
</LiquidGlass>
```

## Integration Examples

### HomeScreen Integration

The `LiquidGlass` component has been integrated into your `HomeScreen`:

- **Portfolio Value Card**: Enhanced with liquid glass effect
- **Quick Action Buttons**: Send, Receive, Swap, and Buy buttons
- **Assets Section**: Token list container
- **Demo Button**: Navigation to test screen

### Navigation

Add the test screen to your navigation:

```tsx
// In your navigation configuration
<Stack.Screen 
  name="LiquidGlassTest" 
  component={LiquidGlassTestScreen} 
  options={{ title: 'Liquid Glass Demo' }}
/>
```

## Performance Best Practices

### 1. Use Appropriate Elasticity Values

- **Low (0.1-0.2)**: For cards and containers
- **Medium (0.2-0.3)**: For interactive elements
- **High (0.3-0.5)**: For playful, bouncy elements

### 2. Optimize Spring Configurations

```tsx
// Smooth, natural feel
springConfig={{ damping: 15, stiffness: 150 }}

// Bouncy, playful feel
springConfig={{ damping: 8, stiffness: 100 }}

// Quick, responsive feel
springConfig={{ damping: 25, stiffness: 200 }}
```

### 3. Limit Concurrent Animations

Avoid having too many `LiquidGlass` components animating simultaneously. Consider disabling animations on scroll or when not in view.

## Troubleshooting

### Common Issues

1. **Animations not working**: Ensure `react-native-reanimated` is properly configured
2. **Performance issues**: Reduce elasticity or use simpler spring configurations
3. **Gesture conflicts**: Check if other gesture handlers are interfering

### Debug Mode

Enable debug logging by checking console output:

```tsx
onPress={() => {
  console.log('🎯 ANIMATION: Component pressed');
}}
```

## Browser Compatibility

- **iOS**: Full support with smooth animations
- **Android**: Full support with smooth animations
- **Web**: Limited support (some effects may not work)

## Future Enhancements

Potential improvements for the `LiquidGlass` component:

- [ ] Add more refraction modes
- [ ] Implement chromatic aberration effects
- [ ] Add support for custom shaders
- [ ] Optimize for different device capabilities
- [ ] Add accessibility features

## Resources

- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
