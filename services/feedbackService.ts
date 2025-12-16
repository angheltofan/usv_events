import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, Feedback, FeedbackStats, CreateFeedbackPayload } from '../types';

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

export const feedbackService = {
  createFeedback: async (payload: CreateFeedbackPayload): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      if (response.status === 201) {
        return { success: true };
      }
      const data = await response.json();
      return { success: false, message: data.message || 'Failed to submit feedback' };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  getMyFeedback: async (): Promise<ApiResponse<Feedback[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/my`, {
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  getEventFeedback: async (eventId: string, page: number = 1): Promise<ApiResponse<Feedback[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}?page=${page}&limit=20`, {
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  getEventStats: async (eventId: string): Promise<ApiResponse<FeedbackStats>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}/stats`, {
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  }
};
