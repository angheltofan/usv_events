
import { API_BASE_URL } from '../constants';
import { ApiResponse, Notification, UnreadCountResponse } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const notificationService = {
  getNotifications: async (page: number = 1, limit: number = 20): Promise<ApiResponse<Notification[]>> => {
      const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<Notification[]>(response);
  },

  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<UnreadCountResponse>(response);
  },

  markAsRead: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      return handleResponse<void>(response, 'Failed to mark as read');
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      return handleResponse<void>(response, 'Failed to mark all as read');
  }
};
