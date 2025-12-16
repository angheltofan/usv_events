import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, User, UpdateProfilePayload, UserInterestsResponse, UpdateInterestsPayload, UpdateRolePayload } from '../types';

const getHeaders = (hasBody: boolean = true) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const userService = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to update profile' };
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  getInterests: async (): Promise<ApiResponse<UserInterestsResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/interests`, {
        method: 'GET',
        headers: getHeaders(false), // No body for GET
      });
      const data = await response.json();
      if (!response.ok) {
         return { success: false, message: 'Failed to fetch interests' };
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  updateInterests: async (payload: UpdateInterestsPayload): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/interests`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        try {
            const data = await response.json();
            return { success: true, ...data };
        } catch(e) {
            return { success: true };
        }
      }
      
      try {
          const data = await response.json();
          return { success: false, message: data.message || 'Failed to update interests' };
      } catch (e) {
          return { success: false, message: `Server error: ${response.status}` };
      }

    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  // ADMIN ONLY: Update another user's role
  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        return { success: true };
      }

      try {
        const data = await response.json();
        return { success: false, message: data.message || 'Failed to update role' };
      } catch (e) {
        return { success: false, message: `Server error: ${response.status}` };
      }
    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  // ADMIN ONLY: Get list of users
  getUsers: async (params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<ApiResponse<User[]>> => {
    try {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.role) query.append('role', params.role);

        const response = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
            method: 'GET',
            headers: getHeaders(false),
        });

        const data = await response.json();
        if (!response.ok) {
            return { success: false, message: data.message || 'Failed to fetch users' };
        }
        return data;
    } catch (e) {
        return { success: false, message: 'Network error occurred.' };
    }
  }
};
