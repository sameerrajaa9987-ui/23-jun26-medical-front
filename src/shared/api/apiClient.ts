import axios, { InternalAxiosRequestConfig } from "axios";
import { environment } from "@config/env";
import { useAuthStore } from "../store/useAuthStore";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (!originalRequest) return Promise.reject(error);

    if (
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const { token, refreshToken } = useAuthStore.getState();
    if (!token && !refreshToken) return Promise.reject(error);

    if (error.response?.status === 401) {
      originalRequest._retry = true;
      try {
        const newToken = await useAuthStore.getState().refreshSession();
        if (newToken) {
          originalRequest.headers.Authorization = "Bearer " + newToken;
          return apiClient(originalRequest);
        }
        await useAuthStore.getState().logout();
      } catch (refreshError) {
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-friendly message from an axios error. */
export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
) {
  const e = err as { response?: { data?: { error?: { message?: string } } } };
  return e?.response?.data?.error?.message || fallback;
}
