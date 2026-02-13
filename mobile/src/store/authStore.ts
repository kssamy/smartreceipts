import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AUTH_STORAGE_KEY = '@smartreceipt_auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  },

  clearAuth: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  },

  loadToken: async () => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (authData) {
        const { user, accessToken, refreshToken } = JSON.parse(authData);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (user) => {
    set({ user });
  },
}));
