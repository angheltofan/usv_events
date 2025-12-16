import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginPayload, RegisterPayload } from '../types';
import { authService } from '../services/authService';
import { LOCAL_STORAGE_KEYS } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<string | null>;
  register: (data: RegisterPayload) => Promise<string | null>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA);

      // 1. Optimistic Load: If we have user data locally, load it immediately
      if (token && savedUser) {
        try {
            setUser(JSON.parse(savedUser));
            setIsLoading(false); // UI is ready instantly
        } catch (e) {
            console.error("Failed to parse saved user data");
        }
      }

      // 2. Network Verification: Check with server if token is still valid and get fresh data
      if (token) {
        try {
          const response = await authService.getMe();
          if (response.success && response.data) {
            setUser(response.data);
            // Update local storage with fresh data
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
          } else {
            // Token invalid or expired - Clear everything
            handleLogoutCleanup();
          }
        } catch (error) {
          console.error("Auth initialization failed", error);
          // Don't logout immediately on network error, allow offline usage if needed or retry
        }
      } else {
          // No token found
          handleLogoutCleanup();
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Listen for storage events to sync logout across tabs
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEYS.ACCESS_TOKEN && e.newValue === null) {
            setUser(null);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogoutCleanup = () => {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
      setUser(null);
  };

  const login = async (payload: LoginPayload): Promise<string | null> => {
    try {
      const response = await authService.login(payload);
      if (response.success && response.data) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user)); // Persist user
        setUser(response.data.user);
        return null;
      } else {
        return response.message || 'Login failed. Please check your credentials.';
      }
    } catch (err) {
      return 'An unexpected error occurred.';
    }
  };

  const register = async (payload: RegisterPayload): Promise<string | null> => {
    try {
      const response = await authService.register(payload);
      if (response.success && response.data) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user)); // Persist user
        setUser(response.data.user);
        return null;
      } else {
        if (response.errors) {
            const errorMsg = Object.values(response.errors).flat().join(', ');
            return errorMsg || response.message || 'Registration failed.';
        }
        return response.message || 'Registration failed.';
      }
    } catch (err) {
      return 'An unexpected error occurred.';
    }
  };

  const logout = () => {
    authService.logout();
    handleLogoutCleanup();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};