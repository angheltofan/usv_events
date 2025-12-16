import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, Faculty, Department, CreateFacultyPayload, CreateDepartmentPayload } from '../types';

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

export const facultyService = {
  getAllFaculties: async (): Promise<ApiResponse<Faculty[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculties`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  createFaculty: async (payload: CreateFacultyPayload): Promise<ApiResponse<Faculty>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculties`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  updateFaculty: async (id: string, payload: Partial<CreateFacultyPayload>): Promise<ApiResponse<Faculty>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  deleteFaculty: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });
      if (!response.ok) return { success: false, message: 'Failed to delete' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  createDepartment: async (payload: CreateDepartmentPayload): Promise<ApiResponse<Department>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  }
};
