import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  jobTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  recentTasks: Task[];
}

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken(false);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && data.error) ||
      (data && typeof data === 'object' && data.message) ||
      `HTTP error! Status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  getProfile: () => apiRequest<UserProfile>('/profile/me'),
  saveProfile: (data: Partial<UserProfile>) =>
    apiRequest<UserProfile>('/profile', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: Partial<UserProfile>) =>
    apiRequest<UserProfile>('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getDashboardStats: () => apiRequest<DashboardStats>('/dashboard/stats'),

  getTasks: () => apiRequest<Task[]>('/tasks'),
  getTask: (id: string) => apiRequest<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) =>
    apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => apiRequest<{ message: string; id: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  deleteAccount: () => apiRequest<{ message: string }>('/account', { method: 'DELETE' }),
};
