import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../constants';
import { ApiResponse, Event, EventStatus, CreateEventPayload, Participant, EventStats } from '../types';

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

// Helper for GET requests to ensure fresh data
const getNoCacheHeaders = () => {
    return {
        ...getHeaders(false),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
};

export const eventService = {
  // Public/Student: Get all events
  getEvents: async (status?: EventStatus): Promise<ApiResponse<Event[]>> => {
    try {
      const url = status 
        ? `${API_BASE_URL}/events?status=${status}&limit=100` 
        : `${API_BASE_URL}/events?limit=100`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getNoCacheHeaders(),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to fetch events' };
      }
      return { success: true, data: Array.isArray(data) ? data : data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  // Organizer: Get my events
  getMyEvents: async (): Promise<ApiResponse<Event[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/my-events`, {
        method: 'GET',
        headers: getNoCacheHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Create Event
  createEvent: async (payload: CreateEventPayload): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
          // Return detailed errors if available
          return { success: false, message: data.message, errors: data.errors };
      }
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Update Event
  updateEvent: async (id: string, payload: Partial<CreateEventPayload>): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
           return { success: false, message: data.message, errors: data.errors };
      }
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Delete Event
  deleteEvent: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });
      if (!response.ok) {
          const data = await response.json();
          return { success: false, message: data.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Submit for Approval
  submitEvent: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}/submit`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      
      if (!response.ok) {
          const data = await response.json();
          return { success: false, message: data.message || 'Submission failed' };
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Get Participants
  getParticipants: async (id: string): Promise<ApiResponse<Participant[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}/participants`, {
            method: 'GET',
            headers: getNoCacheHeaders(),
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Network error.' };
    }
  },

  // Organizer: Check-in
  checkInParticipant: async (id: string, ticketNumber: string): Promise<ApiResponse<void>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${id}/check-in`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ ticketNumber })
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message };
        return { success: true };
      } catch(e) {
          return { success: false, message: 'Network error.' };
      }
  },

  // Admin: Review Event (Approve/Reject)
  reviewEvent: async (id: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}/review`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (response.ok) {
        return { success: true };
      }

      const data = await response.json();
      return { success: false, message: data.message || 'Failed to review event' };
    } catch (e) {
      return { success: false, message: 'Network error occurred.' };
    }
  },

  // Student: Get My Registrations
  getMyRegistrations: async (): Promise<ApiResponse<any[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/registrations`, {
            headers: getNoCacheHeaders()
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Network error.' };
    }
  },

  // Student: Get Favorites
  getFavorites: async (): Promise<ApiResponse<Event[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/favorites`, {
            headers: getNoCacheHeaders()
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Network error.' };
    }
  },

  // Student: Toggle Favorite
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

  // Student: Register
  registerEvent: async (id: string): Promise<ApiResponse<void>> => {
      try {
          const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
              method: 'POST',
              headers: getHeaders(true),
              body: JSON.stringify({})
          });
          const data = await response.json();
          if(!response.ok) return { success: false, message: data.message };
          return { success: true };
      } catch(e) {
          return { success: false, message: 'Network error.' };
      }
  },

  // Student: Cancel Registration
  cancelRegistration: async (id: string): Promise<ApiResponse<void>> => {
      try {
          // FIX: Include empty JSON body and Content-Type header
          // Some backends require a valid JSON body even for DELETE requests
          const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
              method: 'DELETE',
              headers: getHeaders(true), 
              body: JSON.stringify({})
          });
          
          if(!response.ok) {
             try {
                 const data = await response.json();
                 return { success: false, message: data.message || 'Failed to cancel registration' };
             } catch(e) {
                 return { success: false, message: `Failed to cancel registration (${response.status})` };
             }
          }
          return { success: true };
      } catch(e) {
          return { success: false, message: 'Network error.' };
      }
  }
};