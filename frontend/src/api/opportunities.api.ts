import { apiClient } from "./client";
import type { CreateOpportunityPayload } from "@/types/api";
import type { Opportunity } from "@/types/models";

export async function listOpportunities(params: {
  kind?: string;
  domain?: string;
} = {}): Promise<Opportunity[]> {
  const res = await apiClient.get<Opportunity[]>("/opportunities", { params });
  return res.data;
}

export async function createOpportunity(
  payload: CreateOpportunityPayload,
): Promise<Opportunity> {
  const res = await apiClient.post<Opportunity>("/opportunities", payload);
  return res.data;
}

export async function closeOpportunity(id: number): Promise<Opportunity> {
  const res = await apiClient.post<Opportunity>(`/opportunities/${id}/close`);
  return res.data;
}
