import { apiClient } from "./client";
import type { BosSsoConfig, LoginPayload, TokenResponse } from "@/types/api";
import type { User } from "@/types/models";

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  // backend expects OAuth2 form fields: username + password
  const form = new URLSearchParams();
  form.set("username", payload.email);
  form.set("password", payload.password);
  const res = await apiClient.post<TokenResponse>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

export async function fetchMe(): Promise<User> {
  const res = await apiClient.get<User>("/auth/me");
  return res.data;
}

// --- Sign in with BOS (only offered when the backend reports it enabled) ---

export async function fetchBosSsoConfig(): Promise<BosSsoConfig> {
  const res = await apiClient.get<BosSsoConfig>("/auth/bos/config");
  return res.data;
}

/** Full-page navigation target that starts the BOS sign-in on the backend. */
export function bosLoginUrl(): string {
  return `${apiClient.defaults.baseURL}/auth/bos/login`;
}

/** Trade the one-time code from the BOS callback for normal connectX tokens. */
export async function exchangeBosCode(code: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/bos/exchange", { code });
  return res.data;
}
