// Lightweight global token store (Zustand). Server state lives in React Query.
import { create } from "zustand";

const ACCESS_KEY = "cx_access";
const REFRESH_KEY = "cx_refresh";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
}

// In-memory mirror; persisted to localStorage so a refresh keeps the session.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: read(ACCESS_KEY),
  refreshToken: read(REFRESH_KEY),
  setTokens: (access, refresh) => {
    try {
      window.localStorage.setItem(ACCESS_KEY, access);
      window.localStorage.setItem(REFRESH_KEY, refresh);
    } catch {
      /* ignore */
    }
    set({ accessToken: access, refreshToken: refresh });
  },
  clear: () => {
    try {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
    set({ accessToken: null, refreshToken: null });
  },
}));
