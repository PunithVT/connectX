import { apiClient } from "./client";
import type { BecomeMentorPayload, BookSessionPayload } from "@/types/api";
import type {
  MentorLeaderboardEntry,
  MentorProfile,
  MentorReview,
  MentorshipSession,
} from "@/types/models";

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

export async function completeSession(
  sessionId: number,
): Promise<MentorshipSession> {
  const res = await apiClient.post<MentorshipSession>(
    `/mentorship/sessions/${sessionId}/complete`,
  );
  return res.data;
}

export async function reviewSession(payload: {
  session_id: number;
  rating: number;
  comment?: string;
}): Promise<MentorReview> {
  const res = await apiClient.post<MentorReview>("/mentorship/reviews", payload);
  return res.data;
}

export async function listMentorReviews(
  mentorId: number,
): Promise<MentorReview[]> {
  const res = await apiClient.get<MentorReview[]>(
    `/mentorship/mentors/${mentorId}/reviews`,
  );
  return res.data;
}

export async function getLeaderboard(): Promise<MentorLeaderboardEntry[]> {
  const res = await apiClient.get<MentorLeaderboardEntry[]>(
    "/mentorship/leaderboard",
  );
  return res.data;
}
