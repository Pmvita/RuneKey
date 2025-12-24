// RuneKey/src/components/common/AnimatedSettingsItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../../utils/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedSettingsItemProps {
  icon: string | React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'default' | 'danger' | 'warning';
  delay?: number;
  iconType?: 'ionicon' | 'image' | 'custom';
}

export const AnimatedSettingsItem: React.FC<AnimatedSettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  variant = 'default',
  delay = 0,
  iconType = 'ionicon',
}) => {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!hasAnimated.current) {
      opacity.value = withTiming(1, { duration: 400, delay });
      hasAnimated.current = true;
    } else {
      // Keep opacity at 1 on subsequent renders (e.g., theme changes)
      // Use withTiming with 0 duration to set immediately without animation
      opacity.value = withTiming(1, { duration: 0 });
    }
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: colors.error,
          titleColor: colors.error,
          subtitleColor: colors.errorLight,
        };
      case 'warning':
        return {
          iconColor: colors.warning,
          titleColor: colors.warning,
          subtitleColor: colors.warningLight,
        };
      default:
        return {
          iconColor: colors.textTertiary,
          titleColor: colors.textPrimary,
          subtitleColor: colors.textSecondary,
        };
    }
  };

  const styles = getVariantStyles();

  const renderIcon = () => {
    if (iconType === 'image' && typeof icon === 'string') {
      return (
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
      );
    }
    if (iconType === 'custom' && React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'string') {
      return <Ionicons name={icon as any} size={20} color={styles.iconColor} />;
    }
    return null;
  };

  return (
    <AnimatedTouchable
      style={[animatedStyle, {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={{
        width: 40,
        height: 40,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
      }}>
        {renderIcon()}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: styles.titleColor,
          marginBottom: subtitle ? 4 : 0,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: styles.subtitleColor,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View style={{ marginRight: 8 }}>
          {rightElement}
        </View>
      )}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </AnimatedTouchable>
  );
};

