import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const Storage = {
  getItem: (key: string): string | null => {
    try {
      const value = storage.getString(key);
      return value ?? null;
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },

  getObject: <T>(key: string): T | null => {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage setObject error:', error);
    }
  },
};

