import React from 'react';
import { View, StyleSheet } from 'react-native';
import BubbleBackground from './BubbleBackground';

interface UniversalBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const UniversalBackground: React.FC<UniversalBackgroundProps> = ({
  children,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <BubbleBackground />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
