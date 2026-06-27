import { apiClient } from "./client";
import type { InviteAcceptPayload } from "@/types/api";
import type { Invite, InvitePreview } from "@/types/models";

export async function createInvite(data: {
  email: string;
  full_name?: string;
  program_trained?: string;
  batch_year?: number;
}): Promise<Invite> {
  const res = await apiClient.post<Invite>("/invites", data);
  return res.data;
}

export async function bulkInvite(
  invites: Array<{ email: string; full_name?: string; program_trained?: string }>,
): Promise<Invite[]> {
  const res = await apiClient.post<Invite[]>("/invites/bulk", { invites });
  return res.data;
}

export async function listInvites(status?: string): Promise<Invite[]> {
  const res = await apiClient.get<Invite[]>("/invites", {
    params: status ? { status_filter: status } : {},
  });
  return res.data;
}

export async function previewInvite(token: string): Promise<InvitePreview> {
  const res = await apiClient.get<InvitePreview>(`/invites/${token}`);
  return res.data;
}

export async function acceptInvite(
  payload: InviteAcceptPayload,
): Promise<{ status: string; user_id: number; email: string }> {
  const res = await apiClient.post("/invites/accept", payload);
  return res.data;
}
