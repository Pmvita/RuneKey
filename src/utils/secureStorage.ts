import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const canUseSecureStore =
  Platform.OS !== 'web' &&
  typeof SecureStore?.setItemAsync === 'function' &&
  typeof SecureStore?.getItemAsync === 'function' &&
  typeof SecureStore?.deleteItemAsync === 'function';

type StorageValue = string | null;

export const secureStore = {
  async getItem(key: string): Promise<StorageValue> {
    if (canUseSecureStore) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (canUseSecureStore) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (canUseSecureStore) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const isSecureStoreAvailable = canUseSecureStore;

