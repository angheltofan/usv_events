
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
        return { success: false, message: data.message || 'Nu s-au putut prelua evenimentele.' };
      }
      return { success: true, data: Array.isArray(data) ? data : data.data || [] };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
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
      if (!response.ok) return { success: false, message: data.message || 'Eroare la preluarea evenimentelor tale.' };
      return { success: true, data: data.data || [] };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
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
          // Improve error parsing
          const msg = data.message || (data.error ? data.error : 'Eroare la crearea evenimentului.');
          return { success: false, message: msg, errors: data.errors };
      }
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
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
           return { success: false, message: data.message || 'Eroare la actualizare.', errors: data.errors };
      }
      return { success: true, data: data.data };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
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
          const resClone = response.clone();
          try {
            const data = await response.json();
            return { success: false, message: data.message || 'Ștergerea a eșuat.' };
          } catch {
             const text = await resClone.text();
             // Translate raw DB errors to user friendly message
             if (text && (text.toLowerCase().includes('failed query') || text.toLowerCase().includes('constraint') || text.includes('delete from "events"'))) {
                 return { success: false, message: 'Nu se poate șterge evenimentul deoarece există participanți, feedback sau alte date asociate.' };
             }
             return { success: false, message: 'Eroare server la ștergere: ' + (text || response.statusText) };
          }
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Eroare de conexiune.' };
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
          return { success: false, message: data.message || 'Trimiterea spre aprobare a eșuat.' };
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
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
        if(!response.ok) return { success: false, message: data.message || 'Eroare la preluarea participanților.' };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Eroare de rețea.' };
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
        if(!response.ok) return { success: false, message: data.message || 'Check-in eșuat.' };
        return { success: true };
      } catch(e) {
          return { success: false, message: 'Eroare de rețea.' };
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
      return { success: false, message: data.message || 'Eroare la validarea evenimentului.' };
    } catch (e) {
      return { success: false, message: 'Eroare de rețea.' };
    }
  },

  // Student: Get My Registrations
  getMyRegistrations: async (): Promise<ApiResponse<any[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/registrations`, {
            headers: getNoCacheHeaders()
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message || 'Eroare la preluarea înscrierilor.' };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Eroare de rețea.' };
    }
  },

  // Student: Get Favorites
  getFavorites: async (): Promise<ApiResponse<Event[]>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/favorites`, {
            headers: getNoCacheHeaders()
        });
        const data = await response.json();
        if(!response.ok) return { success: false, message: data.message || 'Eroare la preluarea favoritelor.' };
        return { success: true, data: data.data || [] };
    } catch(e) {
        return { success: false, message: 'Eroare de rețea.' };
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
          // Send explicit notes field as per API spec. 
          // This creates a NEW registration.
          const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
              method: 'POST',
              headers: getHeaders(true),
              body: JSON.stringify({ notes: "Web Registration" }) 
          });
          
          if(!response.ok) {
              const data = await response.json();
              // 400 likely means user is already actively registered or event is closed
              return { success: false, message: data.message || 'Înscrierea a eșuat. Verifică dacă ești deja înscris.' };
          }
          return { success: true };
      } catch(e) {
          return { success: false, message: 'Eroare de rețea.' };
      }
  },

  // Student: Cancel Registration
  cancelRegistration: async (id: string): Promise<ApiResponse<void>> => {
      try {
          // FIXED: Removed body from DELETE request. 
          // Use getHeaders(false) to avoid setting Content-Type.
          // This should correctly delete the registration on the server.
          const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
              method: 'DELETE',
              headers: getHeaders(false) 
          });
          
          if(!response.ok) {
             try {
                 const data = await response.json();
                 // If already cancelled/not registered (404 or specific message), treat as success for UI
                 if (response.status === 404 || (data.message && data.message.toLowerCase().includes('not registered'))) {
                     return { success: true }; 
                 }
                 return { success: false, message: data.message || 'Anularea a eșuat.' };
             } catch(e) {
                 return { success: false, message: `Anularea a eșuat (${response.status})` };
             }
          }
          return { success: true };
      } catch(e) {
          return { success: false, message: 'Eroare de rețea.' };
      }
  }
};
