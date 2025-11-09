import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  spinnerSize?: number;
  spinnerColor?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  spinnerSize = 60,
  spinnerColor = '#3B82F6',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <LoadingSpinner 
          size={spinnerSize} 
          color={spinnerColor} 
          strokeWidth={6}
          speed={800}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#111827',
    borderRadius: 20,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
