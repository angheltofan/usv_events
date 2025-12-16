
import { API_BASE_URL } from '../constants';
import { ApiResponse, EventMaterial, CreateMaterialPayload } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const fileService = {
  getEventMaterials: async (eventId: string): Promise<ApiResponse<EventMaterial[]>> => {
      const response = await fetch(`${API_BASE_URL}/files/event/${eventId}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<EventMaterial[]>(response, 'Failed to fetch materials');
  },

  uploadMaterial: async (payload: CreateMaterialPayload): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      if (response.status === 201) return { success: true };
      return handleResponse<void>(response, 'Failed to upload material');
  },

  downloadMaterial: async (id: string): Promise<ApiResponse<{ fileUrl: string }>> => {
      const response = await fetch(`${API_BASE_URL}/files/${id}/download`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      return handleResponse<{ fileUrl: string }>(response, 'Failed to get download link');
  }
};
