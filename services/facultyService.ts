
import { API_BASE_URL } from '../constants';
import { ApiResponse, Faculty, Department, CreateFacultyPayload, CreateDepartmentPayload } from '../types';
import { getHeaders, handleResponse } from './apiUtils';

export const facultyService = {
  getAllFaculties: async (): Promise<ApiResponse<Faculty[]>> => {
      const response = await fetch(`${API_BASE_URL}/faculties`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      return handleResponse<Faculty[]>(response);
  },

  createFaculty: async (payload: CreateFacultyPayload): Promise<ApiResponse<Faculty>> => {
      const response = await fetch(`${API_BASE_URL}/faculties`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<Faculty>(response);
  },

  updateFaculty: async (id: string, payload: Partial<CreateFacultyPayload>): Promise<ApiResponse<Faculty>> => {
      const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<Faculty>(response);
  },

  deleteFaculty: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });
      return handleResponse<void>(response, 'Failed to delete');
  },

  createDepartment: async (payload: CreateDepartmentPayload): Promise<ApiResponse<Department>> => {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<Department>(response);
  }
};
