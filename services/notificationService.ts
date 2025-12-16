import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, Notification, UnreadCountResponse } from '../types';

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

export const notificationService = {
  getNotifications: async (page: number = 1, limit: number = 20): Promise<ApiResponse<Notification[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data || [], pagination: data.pagination };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  markAsRead: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      if (!response.ok) return { success: false, message: 'Failed to mark as read' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      if (!response.ok) return { success: false, message: 'Failed to mark all as read' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  }
};
