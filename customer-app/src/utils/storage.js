import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const storage = {
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, stringValue);
      }
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  },

  async getItem(key) {
    try {
      let value = await AsyncStorage.getItem(key);
      if (!value && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        value = window.localStorage.getItem(key);
      }
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (e) {
      console.warn('Storage get error:', e);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage remove error:', e);
    }
  },
};

export default storage;
