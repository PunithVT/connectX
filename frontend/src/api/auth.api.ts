import { apiClient } from "./client";
import type { LoginPayload, TokenResponse } from "@/types/api";
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
