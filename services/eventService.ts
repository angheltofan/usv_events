
import { API_BASE_URL } from '../constants';
import { ApiResponse, Event, EventStatus, CreateEventPayload, Participant } from '../types';
import { getHeaders, getNoCacheHeaders, handleResponse } from './apiUtils';

export const eventService = {
  getEvents: async (status?: EventStatus): Promise<ApiResponse<Event[]>> => {
      const url = status 
        ? `${API_BASE_URL}/events?status=${status}&limit=100` 
        : `${API_BASE_URL}/events?limit=100`;

      const response = await fetch(url, { method: 'GET', headers: getNoCacheHeaders() });
      return handleResponse<Event[]>(response, 'Nu s-au putut prelua evenimentele.');
  },

  getMyEvents: async (): Promise<ApiResponse<Event[]>> => {
      const response = await fetch(`${API_BASE_URL}/events/my-events`, { method: 'GET', headers: getNoCacheHeaders() });
      return handleResponse<Event[]>(response, 'Eroare la preluarea evenimentelor tale.');
  },

  createEvent: async (payload: CreateEventPayload): Promise<ApiResponse<Event>> => {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<Event>(response, 'Eroare la crearea evenimentului.');
  },

  updateEvent: async (id: string, payload: Partial<CreateEventPayload>): Promise<ApiResponse<Event>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      return handleResponse<Event>(response, 'Eroare la actualizare.');
  },

  deleteEvent: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });
      return handleResponse<void>(response, 'Eroare la ștergerea evenimentului.');
  },

  submitEvent: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/submit`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      return handleResponse<void>(response, 'Trimiterea spre aprobare a eșuat.');
  },

  getParticipants: async (id: string): Promise<ApiResponse<Participant[]>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/participants`, {
          method: 'GET',
          headers: getNoCacheHeaders(),
      });
      return handleResponse<Participant[]>(response, 'Eroare la preluarea participanților.');
  },

  checkInParticipant: async (id: string, ticketNumber: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/check-in`, {
          method: 'POST',
          headers: getHeaders(true),
          body: JSON.stringify({ ticketNumber })
      });
      return handleResponse<void>(response, 'Check-in eșuat.');
  },

  reviewEvent: async (id: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/review`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ status, rejectionReason }),
      });
      return handleResponse<void>(response, 'Eroare la validarea evenimentului.');
  },

  getMyRegistrations: async (): Promise<ApiResponse<any[]>> => {
      const response = await fetch(`${API_BASE_URL}/events/registrations`, { headers: getNoCacheHeaders() });
      return handleResponse<any[]>(response, 'Eroare la preluarea înscrierilor.');
  },

  getFavorites: async (): Promise<ApiResponse<Event[]>> => {
      const response = await fetch(`${API_BASE_URL}/events/favorites`, { headers: getNoCacheHeaders() });
      return handleResponse<Event[]>(response, 'Eroare la preluarea favoritelor.');
  },

  toggleFavorite: async (id: string, isFavorite: boolean): Promise<ApiResponse<void>> => {
      try {
          const method = isFavorite ? 'DELETE' : 'POST';
          const response = await fetch(`${API_BASE_URL}/events/${id}/favorite`, {
              method,
              headers: getHeaders(false)
          });
          if(!response.ok) return { success: false };
          return { success: true };
      } catch(e) {
          return { success: false };
      }
  },

  registerEvent: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
          method: 'POST',
          headers: getHeaders(true),
          body: JSON.stringify({ notes: "Web Registration" }) 
      });
      return handleResponse<void>(response, 'Înscrierea a eșuat. Verifică dacă ești deja înscris.');
  },

  cancelRegistration: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
          method: 'DELETE',
          headers: getHeaders(false) 
      });
      
      // Custom handling for 404 on delete (idempotency)
      if(!response.ok) {
          if (response.status === 404) return { success: true };
          return handleResponse<void>(response, 'Anularea a eșuat.');
      }
      return { success: true };
  }
};
