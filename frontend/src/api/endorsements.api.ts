import { apiClient } from "./client";
import type { SkillEndorsement } from "@/types/models";

export async function listEndorsements(
  userId: number,
): Promise<SkillEndorsement[]> {
  const res = await apiClient.get<SkillEndorsement[]>(`/endorsements/${userId}`);
  return res.data;
}

export async function endorse(
  userId: number,
  skill: string,
): Promise<SkillEndorsement[]> {
  const res = await apiClient.post<SkillEndorsement[]>(`/endorsements/${userId}`, {
    skill,
  });
  return res.data;
}

export async function removeEndorsement(
  userId: number,
  skill: string,
): Promise<SkillEndorsement[]> {
  const res = await apiClient.delete<SkillEndorsement[]>(`/endorsements/${userId}`, {
    data: { skill },
  });
  return res.data;
}
