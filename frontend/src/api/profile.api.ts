import { apiClient } from "./client";
import type { AlumniProfile } from "@/types/models";

export async function fetchMyProfile(): Promise<AlumniProfile> {
  const res = await apiClient.get<AlumniProfile>("/profiles/me");
  return res.data;
}

export async function updateMyProfile(
  data: Partial<AlumniProfile>,
): Promise<AlumniProfile> {
  const res = await apiClient.put<AlumniProfile>("/profiles/me", data);
  return res.data;
}

export async function fetchProfile(userId: number): Promise<AlumniProfile> {
  const res = await apiClient.get<AlumniProfile>(`/profiles/${userId}`);
  return res.data;
}

export async function listProfiles(domain?: string): Promise<AlumniProfile[]> {
  const res = await apiClient.get<AlumniProfile[]>("/profiles", {
    params: domain ? { domain } : {},
  });
  return res.data;
}
