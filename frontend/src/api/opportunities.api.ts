import { apiClient } from "./client";
import type { CreateOpportunityPayload } from "@/types/api";
import type { Application, Opportunity } from "@/types/models";

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

export async function applyToOpportunity(
  id: number,
  note?: string,
): Promise<Application> {
  const res = await apiClient.post<Application>(`/opportunities/${id}/apply`, {
    note,
  });
  return res.data;
}

export async function referCandidate(
  id: number,
  candidateId: number,
  note?: string,
): Promise<Application> {
  const res = await apiClient.post<Application>(`/opportunities/${id}/refer`, {
    candidate_id: candidateId,
    note,
  });
  return res.data;
}

export async function listApplications(id: number): Promise<Application[]> {
  const res = await apiClient.get<Application[]>(
    `/opportunities/${id}/applications`,
  );
  return res.data;
}

export async function listMyApplications(): Promise<Application[]> {
  const res = await apiClient.get<Application[]>(
    "/opportunities/applications/mine",
  );
  return res.data;
}

export async function updateApplicationStatus(
  applicationId: number,
  status: string,
): Promise<Application> {
  const res = await apiClient.patch<Application>(
    `/opportunities/applications/${applicationId}`,
    { status },
  );
  return res.data;
}
