import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_URL, API_ENDPOINTS } from '../config/api';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();

        if (refreshToken) {
          const response = await axios.post(`${API_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
            refreshToken,
          });

          const { accessToken: newAccessToken } = response.data.data;

          // Update store with new token
          const { user, refreshToken: oldRefreshToken } = useAuthStore.getState();
          if (user && oldRefreshToken) {
            await useAuthStore.getState().setAuth(user, newAccessToken, oldRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Methods
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post(API_ENDPOINTS.REGISTER, data),

  login: (data: { email: string; password: string }) =>
    api.post(API_ENDPOINTS.LOGIN, data),

  getProfile: () => api.get(API_ENDPOINTS.PROFILE),

  updateProfile: (data: { name?: string; settings?: any }) =>
    api.put(API_ENDPOINTS.PROFILE, data),
};

export const receiptAPI = {
  create: (data: any) => api.post(API_ENDPOINTS.RECEIPTS, data),

  getAll: (params?: { startDate?: string; endDate?: string; store?: string; limit?: number; skip?: number }) =>
    api.get(API_ENDPOINTS.RECEIPTS, { params }),

  getById: (id: string) => api.get(API_ENDPOINTS.RECEIPT_BY_ID(id)),

  update: (id: string, data: any) => api.put(API_ENDPOINTS.RECEIPT_BY_ID(id), data),

  delete: (id: string) => api.delete(API_ENDPOINTS.RECEIPT_BY_ID(id)),
};

export const analyticsAPI = {
  getOverview: (params?: { startDate?: string; endDate?: string }) =>
    api.get(API_ENDPOINTS.DASHBOARD_OVERVIEW, { params }),

  getSpendingByCategory: (params?: { startDate?: string; endDate?: string }) =>
    api.get(API_ENDPOINTS.SPENDING_BY_CATEGORY, { params }),

  getSpendingTrends: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) =>
    api.get(API_ENDPOINTS.SPENDING_TRENDS, { params }),

  getTopItems: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get(API_ENDPOINTS.TOP_ITEMS, { params }),

  getSpendingByStore: (params?: { startDate?: string; endDate?: string }) =>
    api.get(API_ENDPOINTS.SPENDING_BY_STORE, { params }),
};
