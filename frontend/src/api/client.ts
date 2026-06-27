// Axios instance with auth + refresh interceptors.
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/store";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    setTokens(res.data.access_token, res.data.refresh_token);
    return res.data.access_token as string;
  } catch {
    clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);
