import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, AuthResponseData, LoginPayload, RegisterPayload, User } from '../types';

// Helper to handle headers
const getHeaders = (token?: string, hasBody: boolean = true) => {
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

// Generic API handler
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    // Clone response in case we need to read it as text if JSON fails
    const resClone = response.clone();
    
    try {
        const data = await response.json();
        
        if (!response.ok) {
            // Specific handling for 401 Unauthorized to provide user-friendly message
            if (response.status === 401) {
                return { success: false, message: 'Email sau parolă incorectă.' };
            }

            // If the server returns an error object, mix it with success: false
            if (data && (data.message || data.errors)) {
                return { ...data, success: false };
            }
            // Otherwise construct a generic error
            return { success: false, message: data.message || `Request failed with status ${response.status}` };
        }
        return data;
    } catch (jsonError) {
        // If JSON parsing fails, check status codes
        if (response.status === 401) {
             return { success: false, message: 'Email sau parolă incorectă.' };
        }
        
        // Try to read text body
        const text = await resClone.text();
        return { 
            success: false, 
            message: text || `Server error (${response.status})` 
        };
    }
  } catch (error) {
    return { success: false, message: 'Network connection error' };
  }
}

export const authService = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(undefined, true),
        body: JSON.stringify(payload),
      });
      return handleResponse<AuthResponseData>(response);
    } catch (e) {
      return { success: false, message: 'Eroare de conexiune. Verifică internetul.' };
    }
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(undefined, true),
        body: JSON.stringify(payload),
      });
      return handleResponse<AuthResponseData>(response);
    } catch (e) {
      return { success: false, message: 'Eroare de conexiune. Verifică internetul.' };
    }
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return { success: false, message: 'No token found' };

    try {
      // Changed endpoint from /auth/me to /users/me to match spec
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getHeaders(token, false), // false = no Content-Type for GET
      });
      
      const res = await handleResponse<{ id: string }>(response); 
      // Ensure the response shape matches User. Some backends might wrap it in data property twice or differently.
      // Based on spec: { success: true, data: { ...user } }
      // handleResponse returns the full object.
      return res as unknown as ApiResponse<User>;
    } catch (e) {
      return { success: false, message: 'Failed to fetch user profile.' };
    }
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) || undefined;
    
    if(refreshToken) {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: getHeaders(token, true),
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