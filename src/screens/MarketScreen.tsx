import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { UniversalBackground } from '../components';

export const MarketScreen: React.FC = () => {
  return (
    <UniversalBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Market</Text>
        </View>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
