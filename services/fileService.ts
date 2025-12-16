import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, EventMaterial, CreateMaterialPayload } from '../types';

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

export const fileService = {
  getEventMaterials: async (eventId: string): Promise<ApiResponse<EventMaterial[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/event/${eventId}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Failed to fetch materials' };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  uploadMaterial: async (payload: CreateMaterialPayload): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      if (response.status === 201) {
        return { success: true };
      }
      const data = await response.json();
      return { success: false, message: data.message || 'Failed to upload material' };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  downloadMaterial: async (id: string): Promise<ApiResponse<{ fileUrl: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${id}/download`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Failed to get download link' };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  }
};