import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER_SESSION: 'user-session',
  QUERY_CACHE: 'query-cache',
  THEME: 'theme-preference',
} as const;

// AsyncStorage helper functions
export const storage = {
  set: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
    }
  },

  get: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return null;
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Query cache persistence functions
export const persistQueryCache = async (cache: string): Promise<void> => {
  await storage.set(STORAGE_KEYS.QUERY_CACHE, cache);
};

export const restoreQueryCache = async (): Promise<string | null> => {
  return await storage.get(STORAGE_KEYS.QUERY_CACHE);
};