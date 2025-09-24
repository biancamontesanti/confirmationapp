import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Event {
  _id: string;
  name: string;
  host_name: string;
  date_time: string;
  location: string;
  dress_code?: string;
  event_type: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  _id: string;
  event_id: string;
  name: string;
  email: string;
  response: 'yes' | 'no' | 'pending';
  plus_ones: string;
  responded_at?: string;
  created_at: string;
}

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get<Event[]>('/events'),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (event: Omit<Event, '_id' | 'created_at' | 'updated_at'>) =>
    api.post('/events', event),
  update: (id: string, event: Partial<Event>) =>
    api.put(`/events/${id}`, event),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Guests API
export const guestsAPI = {
  getByEventId: (eventId: string) =>
    api.get<Guest[]>(`/guests/event/${eventId}`),
  addToEvent: (eventId: string, name: string, email: string) =>
    api.post(`/guests/event/${eventId}`, { name, email }),
  getPublicEvent: (eventId: string) =>
    api.get<Event>(`/guests/public/event/${eventId}`),
  rsvp: (eventId: string, name: string, response: 'yes' | 'no', plus_ones: string[] = []) =>
    api.post(`/guests/rsvp/${eventId}`, { name, response, plus_ones }),
  getRsvpStatus: (eventId: string, name: string) =>
    api.get<Guest>(`/guests/rsvp/${eventId}/${name}`),
};

export default api;
