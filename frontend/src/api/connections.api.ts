import { apiClient } from "./client";
import type { ConnectionStatus, ConnectionUser } from "@/types/models";

export async function getConnectionStatus(userId: number): Promise<ConnectionStatus> {
  const res = await apiClient.get<ConnectionStatus>(`/connections/status/${userId}`);
  return res.data;
}

export async function requestConnection(userId: number): Promise<ConnectionStatus> {
  const res = await apiClient.post<ConnectionStatus>(`/connections/${userId}`);
  return res.data;
}

export async function acceptConnection(connectionId: number): Promise<ConnectionStatus> {
  const res = await apiClient.post<ConnectionStatus>(`/connections/${connectionId}/accept`);
  return res.data;
}

export async function declineConnection(connectionId: number): Promise<void> {
  await apiClient.post(`/connections/${connectionId}/decline`);
}

export async function listConnections(): Promise<ConnectionUser[]> {
  const res = await apiClient.get<ConnectionUser[]>("/connections");
  return res.data;
}

export async function listPendingRequests(): Promise<ConnectionUser[]> {
  const res = await apiClient.get<ConnectionUser[]>("/connections/pending");
  return res.data;
}
