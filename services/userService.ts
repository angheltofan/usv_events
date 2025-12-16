
import { API_BASE_URL } from '../constants';
import { ApiResponse, User, UpdateProfilePayload, UserInterestsResponse, UpdateInterestsPayload } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const userService = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<User>> => {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<User>(response, 'Failed to update profile');
  },

  getInterests: async (): Promise<ApiResponse<UserInterestsResponse>> => {
      const response = await fetch(`${API_BASE_URL}/users/me/interests`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<UserInterestsResponse>(response, 'Failed to fetch interests');
  },

  updateInterests: async (payload: UpdateInterestsPayload): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/users/me/interests`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<void>(response, 'Failed to update interests');
  },

  // ADMIN ONLY: Update another user's role
  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ role }),
      });
      return handleResponse<void>(response, 'Failed to update role');
  },

  // ADMIN ONLY: Get list of users
  getUsers: async (params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<ApiResponse<User[]>> => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.search) query.append('search', params.search);
      if (params.role) query.append('role', params.role);

      const response = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
          method: 'GET',
          headers: getHeaders(false),
      });
      return handleResponse<User[]>(response, 'Failed to fetch users');
  }
};
