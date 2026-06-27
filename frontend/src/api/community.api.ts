import { apiClient } from "./client";
import type { Community } from "@/types/models";

export async function listCommunities(): Promise<Community[]> {
  const res = await apiClient.get<Community[]>("/community");
  return res.data;
}

export async function joinCommunity(id: number): Promise<Community> {
  const res = await apiClient.post<Community>(`/community/${id}/join`);
  return res.data;
}

export interface CreateCommunityPayload {
  name: string;
  slug: string;
  description?: string;
}

export async function createCommunity(payload: CreateCommunityPayload): Promise<Community> {
  const res = await apiClient.post<Community>("/community", payload);
  return res.data;
}
