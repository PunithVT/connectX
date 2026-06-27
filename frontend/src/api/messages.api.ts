import { apiClient } from "./client";
import type { Conversation, Message } from "@/types/models";

export async function listConversations(): Promise<Conversation[]> {
  const res = await apiClient.get<Conversation[]>("/messages");
  return res.data;
}

export async function getThread(userId: number): Promise<Message[]> {
  const res = await apiClient.get<Message[]>(`/messages/${userId}`);
  return res.data;
}

export async function sendMessage(userId: number, body: string): Promise<Message> {
  const res = await apiClient.post<Message>(`/messages/${userId}`, { body });
  return res.data;
}
