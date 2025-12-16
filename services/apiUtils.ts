
import { LOCAL_STORAGE_KEYS } from '../constants';

export const getHeaders = (hasBody: boolean = true) => {
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

// Headers specific for GET requests where we want to ensure no caching
export const getNoCacheHeaders = () => {
    return {
        ...getHeaders(false),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
};

export const handleResponse = async <T>(response: Response, defaultErrorMsg: string = 'Request failed'): Promise<{ success: boolean; data?: T; message?: string; pagination?: any, errors?: any }> => {
    try {
        const contentType = response.headers.get("content-type");
        let data: any = {};
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
             // Fallback for non-JSON responses (rare but possible)
             const text = await response.text();
             if (text) data = { message: text };
        }

        if (!response.ok) {
            return { 
                success: false, 
                message: data.message || data.error || defaultErrorMsg,
                errors: data.errors
            };
        }
        
        // Return full structure as existing services expect
        return { 
            success: true, 
            data: Array.isArray(data) ? data : (data.data || data), 
            message: data.message,
            pagination: data.pagination
        };
    } catch (e) {
        return { success: false, message: 'Eroare de conexiune sau formatare răspuns.' };
    }
};
