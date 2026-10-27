import { Capacitor } from '@capacitor/core';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key });
        if (value !== null && value !== undefined) {
          return value;
        }
      } catch (e) {
        console.warn("Preferences.get failed, checking localStorage fallback", e);
      }
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value });
      } catch (e) {
        console.warn("Preferences.set failed", e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn("localStorage.setItem failed", e);
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key });
      } catch (e) {
        console.warn("Preferences.remove failed", e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn("localStorage.removeItem failed", e);
      }
    }
  }
};

export default storage;
