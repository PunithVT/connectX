import { apiClient } from "./client";
import type { Spotlight } from "@/types/models";

export interface CreateSpotlightPayload {
  title: string;
  story: string;
  program_trained?: string;
  cover_emoji?: string;
}

export async function listSpotlights(featuredOnly = false): Promise<Spotlight[]> {
  const res = await apiClient.get<Spotlight[]>("/spotlight", {
    params: { featured_only: featuredOnly },
  });
  return res.data;
}

export async function shareStory(
  data: CreateSpotlightPayload,
): Promise<Spotlight> {
  const res = await apiClient.post<Spotlight>("/spotlight", data);
  return res.data;
}

export async function likeStory(id: number): Promise<Spotlight> {
  const res = await apiClient.post<Spotlight>(`/spotlight/${id}/like`);
  return res.data;
}
