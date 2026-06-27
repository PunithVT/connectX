import { apiClient } from "./client";
import type { BecomeMentorPayload, BookSessionPayload } from "@/types/api";
import type { MentorProfile, MentorshipSession } from "@/types/models";

export async function listMentors(): Promise<MentorProfile[]> {
  const res = await apiClient.get<MentorProfile[]>("/mentorship/mentors");
  return res.data;
}

export async function becomeMentor(
  payload: BecomeMentorPayload,
): Promise<MentorProfile> {
  const res = await apiClient.post<MentorProfile>("/mentorship/mentors", payload);
  return res.data;
}

export async function listMySessions(): Promise<MentorshipSession[]> {
  const res = await apiClient.get<MentorshipSession[]>("/mentorship/sessions");
  return res.data;
}

export async function bookSession(
  payload: BookSessionPayload,
): Promise<MentorshipSession> {
  const res = await apiClient.post<MentorshipSession>(
    "/mentorship/sessions",
    payload,
  );
  return res.data;
}
