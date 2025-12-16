
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, AuthResponseData, LoginPayload, RegisterPayload, User } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const authService = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      // specific 401 handling
      if(response.status === 401) return { success: false, message: 'Email sau parolă incorectă.' };
      return handleResponse<AuthResponseData>(response);
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<AuthResponseData>(response);
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return { success: false, message: 'No token found' };

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<User>(response);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) || undefined;
    
    if(refreshToken) {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: getHeaders(true), // Uses centralized header logic now, slightly cleaner
                body: JSON.stringify({ refreshToken })
            });
        } catch (e) {
            console.error("Logout failed on server", e);
        }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    return { success: true };
  }
};
