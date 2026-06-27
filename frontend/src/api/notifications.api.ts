import { apiClient } from "./client";
import type { AppNotification } from "@/types/models";

export async function listNotifications(
  unreadOnly = false,
): Promise<AppNotification[]> {
  const res = await apiClient.get<AppNotification[]>("/notifications", {
    params: { unread_only: unreadOnly },
  });
  return res.data;
}

export async function markRead(id: number): Promise<AppNotification> {
  const res = await apiClient.post<AppNotification>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
