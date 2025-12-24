import axios from 'axios';

// Get API URL - use environment variable or detect from window location
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // If we're on mobile (not localhost), use the host's IP
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3001/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: number;
  invite_token: string;
  name: string | null;
  created_at: string;
  total_completed_tasks: number;
  roulette_weight: number;
  has_spun_roulette: boolean;
}

export interface Task {
  id: number;
  day_number: number;
  title: string;
  description: string;
  input_type: 'text' | 'photo' | 'text+photo';
  order: number;
  text_prompt?: string | null;
  is_completed: boolean;
}

export interface Progress {
  total_completed_tasks: number;
  days_participated: number;
  roulette_weight: number;
}

export const authApi = {
  join: async (token: string) => {
    const response = await api.post(`/auth/join/${token}`);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateName: async (name: string): Promise<User> => {
    const response = await api.put('/auth/me', { name });
    return response.data;
  },
};

export interface Submission {
  id: number;
  task_id: number;
  text_answer: string | null;
  media_url: string | null;
  created_at: string;
  task: {
    title: string;
    description: string;
    input_type: 'text' | 'photo' | 'text+photo';
  };
}

export const tasksApi = {
  getToday: async () => {
    const response = await api.get('/tasks/today');
    return response.data;
  },
  getSubmission: async (taskId: number): Promise<Submission> => {
    const response = await api.get(`/tasks/${taskId}/submission`);
    return response.data;
  },
  submit: async (taskId: number, data: { text_answer?: string; media_url?: string }) => {
    const response = await api.post(`/tasks/${taskId}/submit`, data);
    return response.data;
  },
};

export const progressApi = {
  get: async (): Promise<Progress> => {
    const response = await api.get('/progress');
    return response.data;
  },
};

export const rouletteApi = {
  getStatus: async () => {
    const response = await api.get('/roulette/status');
    return response.data;
  },
  spin: async () => {
    const response = await api.post('/roulette/spin');
    return response.data;
  },
};

export const finalApi = {
  get: async () => {
    const response = await api.get('/final');
    return response.data;
  },
};

export interface Story {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  title: string | null;
  is_viewed: boolean;
}

export const storiesApi = {
  get: async (): Promise<{ stories: Story[]; has_unread: boolean }> => {
    const response = await api.get('/stories');
    return response.data;
  },
  markViewed: async (storyId: number) => {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Ошибка загрузки файла' }));
      throw new Error(errorData.error || 'Ошибка загрузки файла');
    }
    
    const data = await response.json();
    return data.url;
  },
};

// Admin API with password authentication
const getAdminHeaders = () => {
  const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') : null;
  return adminPassword ? { 'x-admin-password': adminPassword } : {};
};

export const adminApi = {
  login: async (password: string) => {
    const response = await api.post('/admin/login', { password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminPassword', password);
    }
    return response.data;
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminPassword');
    }
  },
  
  isAuthenticated: () => {
    return typeof window !== 'undefined' && localStorage.getItem('adminPassword') === '2912';
  },
  
  tasks: {
    getAll: async () => {
      const response = await api.get('/admin/tasks', { headers: getAdminHeaders() });
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/admin/tasks', data, { headers: getAdminHeaders() });
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/admin/tasks/${id}`, data, { headers: getAdminHeaders() });
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/tasks/${id}`, { headers: getAdminHeaders() });
      return response.data;
    },
  },
  
  users: {
    getAll: async () => {
      const response = await api.get('/admin/users', { headers: getAdminHeaders() });
      return response.data;
    },
    updateWeight: async (id: number, roulette_weight: number) => {
      const response = await api.put(`/admin/users/${id}/weight`, { roulette_weight }, { headers: getAdminHeaders() });
      return response.data;
    },
    resetOnboarding: async (id: number) => {
      const response = await api.delete(`/admin/users/${id}/onboarding`, { headers: getAdminHeaders() });
      return response.data;
    },
  },
  
  submissions: {
    getAll: async () => {
      const response = await api.get('/admin/submissions', { headers: getAdminHeaders() });
      return response.data;
    },
  },
  
  stories: {
    getAll: async () => {
      const response = await api.get('/admin/stories', { headers: getAdminHeaders() });
      return response.data;
    },
    create: async (formData: FormData) => {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') : null;
      const response = await fetch(`${API_URL}/admin/stories`, {
        method: 'POST',
        headers: adminPassword ? { 'x-admin-password': adminPassword } : {},
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания story');
      }
      return response.json();
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/admin/stories/${id}`, data, { headers: getAdminHeaders() });
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/stories/${id}`, { headers: getAdminHeaders() });
      return response.data;
    },
  },
  
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') : null;
    
    const response = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      headers: adminPassword ? { 'x-admin-password': adminPassword } : {},
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Ошибка загрузки файла' }));
      throw new Error(errorData.error || 'Ошибка загрузки файла');
    }
    
    const data = await response.json();
    return data.url;
  },
  
  roulette: {
    getWinner: async () => {
      const response = await api.get('/admin/roulette/winner', { headers: getAdminHeaders() });
      return response.data;
    },
  },
  
  inviteTokens: {
    getAll: async () => {
      const response = await api.get('/admin/invite-tokens', { headers: getAdminHeaders() });
      return response.data;
    },
    create: async () => {
      const response = await api.post('/admin/invite-tokens', {}, { headers: getAdminHeaders() });
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/invite-tokens/${id}`, { headers: getAdminHeaders() });
      return response.data;
    },
  },
};

export default api;

