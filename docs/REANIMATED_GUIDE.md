# React Native Reanimated Implementation Guide

## Overview

React Native Reanimated is a powerful animation library that provides 60fps animations by running animations on the UI thread. This guide covers industry-standard implementation for the RuneKey project.

## Installation & Setup

### 1. Install Dependencies
```bash
npm install react-native-reanimated
```

### 2. Configure Babel (Already Done)
```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin', // ✅ Already configured
    ],
  };
};
```

### 3. Import in App.tsx
```typescript
// App.tsx - Add this import at the top
import 'react-native-reanimated';
```

## Industry Standards Implementation

### 1. Performance Best Practices

#### ✅ DO:
- Use `useSharedValue` for values that change frequently
- Use `useAnimatedStyle` for style animations
- Use `withTiming` for smooth transitions
- Use `withSpring` for natural-feeling animations
- Run animations on the UI thread (automatic with Reanimated 2)

#### ❌ DON'T:
- Don't use `useState` for animated values
- Don't use `setTimeout` for animations
- Don't animate layout properties frequently
- Don't create animations in render functions

### 2. Animation Patterns

#### Portfolio Value Animation
```typescript
// AnimatedNumber.tsx - Smooth counting animation
const animatedValue = useSharedValue(0);

useEffect(() => {
  animatedValue.value = withTiming(value, {
    duration: 1000,
  });
}, [value]);
```

#### Price Change Animation
```typescript
// AnimatedPriceChange.tsx - Scale and color transitions
const scaleValue = useSharedValue(1);

useEffect(() => {
  if (value !== previousValue) {
    scaleValue.value = withSpring(1.2, {
      damping: 10,
      stiffness: 100,
    });
  }
}, [value, previousValue]);
```

#### Loading States
```typescript
// SkeletonLoader.tsx - Pulse animation
const animatedValue = useSharedValue(0);

useEffect(() => {
  animatedValue.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1,
    true
  );
}, []);
```

### 3. Component Architecture

#### Animated Components Created:
1. **AnimatedNumber** - Smooth counting for portfolio values
2. **AnimatedPriceChange** - Price movement indicators
3. **SkeletonLoader** - Loading states with pulse animation

#### Usage Examples:
```typescript
// Portfolio value with smooth counting
<AnimatedNumber
  value={calculateTotalValue()}
  format="currency"
  duration={1500}
/>

// Price change with scale animation
<AnimatedPriceChange
  value={priceChange24h}
  previousValue={previousPriceChange}
/>

// Loading skeleton
<TokenSkeleton />
```

## Advanced Animation Techniques

### 1. Gesture-Based Animations
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onUpdate((event) => {
    translateX.value = event.translationX;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
  });
```

### 2. Complex Animations
```typescript
// Chart animations
const chartAnimation = useAnimatedStyle(() => {
  const progress = interpolate(
    animatedProgress.value,
    [0, 1],
    [0, chartHeight],
    Extrapolate.CLAMP
  );
  
  return {
    height: progress,
  };
});
```

### 3. Staggered Animations
```typescript
// Token list animations
const tokenAnimations = tokens.map((_, index) => {
  const delay = index * 100;
  
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      delay,
    });
  }, []);
});
```

## Performance Optimization

### 1. Memory Management
```typescript
// Clean up animations on unmount
useEffect(() => {
  return () => {
    animatedValue.value = 0;
  };
}, []);
```

### 2. Conditional Animations
```typescript
// Only animate when values actually change
useEffect(() => {
  if (Math.abs(newValue - currentValue) > 0.01) {
    animatedValue.value = withTiming(newValue);
  }
}, [newValue]);
```

### 3. Batch Updates
```typescript
// Update multiple values simultaneously
const updateValues = () => {
  'worklet';
  animatedValue1.value = withTiming(value1);
  animatedValue2.value = withTiming(value2);
  animatedValue3.value = withTiming(value3);
};
```

## Testing Animations

### 1. Unit Testing
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useSharedValue } from 'react-native-reanimated';

test('animated value updates correctly', () => {
  const { result } = renderHook(() => useSharedValue(0));
  
  act(() => {
    result.current.value = 100;
  });
  
  expect(result.current.value).toBe(100);
});
```

### 2. Integration Testing
```typescript
// Test animation completion
const onAnimationComplete = jest.fn();

<AnimatedNumber
  value={100}
  onAnimationComplete={onAnimationComplete}
/>

// Wait for animation to complete
await waitFor(() => {
  expect(onAnimationComplete).toHaveBeenCalled();
}, { timeout: 2000 });
```

## Debugging Animations

### 1. Enable Debug Mode
```typescript
// In development
if (__DEV__) {
  console.log('Animation value:', animatedValue.value);
}
```

### 2. Performance Monitoring
```typescript
import { Performance } from 'react-native-performance';

const measureAnimation = () => {
  const start = Performance.now();
  
  animatedValue.value = withTiming(100, {
    duration: 1000,
  });
  
  const end = Performance.now();
  console.log('Animation took:', end - start, 'ms');
};
```

## Future Enhancements

### 1. Planned Animations
- [ ] Chart line animations
- [ ] Token sorting animations
- [ ] Navigation transitions
- [ ] Pull-to-refresh animations
- [ ] Modal animations

### 2. Advanced Features
- [ ] Haptic feedback integration
- [ ] Accessibility animations
- [ ] Dark mode transitions
- [ ] Custom easing functions

## Resources

- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Animation Performance Guide](https://reactnative.dev/docs/performance#my-views-are-animating-but-they-arent-smooth)
- [Gesture Handler Integration](https://docs.swmansion.com/react-native-gesture-handler/)

## Conclusion

React Native Reanimated provides the foundation for smooth, performant animations in the RuneKey app. By following these industry standards, we ensure:

1. **60fps animations** on all devices
2. **Smooth user experience** with natural transitions
3. **Maintainable code** with reusable components
4. **Performance optimization** with proper memory management
5. **Accessibility compliance** with proper animation timing

The implemented components serve as templates for future animation needs while maintaining consistency across the application. 