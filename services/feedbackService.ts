
import { API_BASE_URL } from '../constants';
import { ApiResponse, Feedback, FeedbackStats, CreateFeedbackPayload } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const feedbackService = {
  createFeedback: async (payload: CreateFeedbackPayload): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      if (response.status === 201) return { success: true };
      return handleResponse<void>(response, 'Failed to submit feedback');
  },

  getMyFeedback: async (): Promise<ApiResponse<Feedback[]>> => {
      const response = await fetch(`${API_BASE_URL}/feedback/my`, { headers: getHeaders(false) });
      return handleResponse<Feedback[]>(response);
  },

  getEventFeedback: async (eventId: string, page: number = 1): Promise<ApiResponse<Feedback[]>> => {
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}?page=${page}&limit=20`, {
        headers: getHeaders(false),
      });
      return handleResponse<Feedback[]>(response);
  },

  getEventStats: async (eventId: string): Promise<ApiResponse<FeedbackStats>> => {
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}/stats`, {
        headers: getHeaders(false),
      });
      return handleResponse<FeedbackStats>(response);
  }
};
