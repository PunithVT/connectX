import { apiClient } from "./client";
import type { AlumniEvent } from "@/types/models";

export interface CreateEventPayload {
  title: string;
  description?: string;
  kind: string;
  location?: string;
  meeting_url?: string;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  cover_emoji?: string;
}

export async function listEvents(upcoming = true): Promise<AlumniEvent[]> {
  const res = await apiClient.get<AlumniEvent[]>("/events", {
    params: { upcoming },
  });
  return res.data;
}

export async function createEvent(data: CreateEventPayload): Promise<AlumniEvent> {
  const res = await apiClient.post<AlumniEvent>("/events", data);
  return res.data;
}

export async function rsvpEvent(eventId: number): Promise<AlumniEvent> {
  const res = await apiClient.post<AlumniEvent>(`/events/${eventId}/rsvp`);
  return res.data;
}

export async function cancelRsvp(eventId: number): Promise<AlumniEvent> {
  const res = await apiClient.delete<AlumniEvent>(`/events/${eventId}/rsvp`);
  return res.data;
}

export async function listMyEvents(): Promise<AlumniEvent[]> {
  const res = await apiClient.get<AlumniEvent[]>("/events/mine/list");
  return res.data;
}
