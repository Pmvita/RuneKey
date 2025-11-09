import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TabOption {
  key: string;
  label: string;
}

interface TabSelectorProps {
  options: TabOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: any;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  options,
  selectedKey,
  onSelect,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#111827', '#020617']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.tabOption,
              selectedKey === option.key && styles.selectedTab
            ]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedKey === option.key && styles.selectedTabText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    flexDirection: 'row',
    padding: 4,
  },
  tabOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: '#111827',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
});
