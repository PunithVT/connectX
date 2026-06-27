import { apiClient } from "./client";
import type { StartupApplyPayload } from "@/types/api";
import type { StartupProject } from "@/types/models";

export async function listProjects(): Promise<StartupProject[]> {
  const res = await apiClient.get<StartupProject[]>("/startupvarsity");
  return res.data;
}

export async function applyForResources(
  payload: StartupApplyPayload,
): Promise<StartupProject> {
  const res = await apiClient.post<StartupProject>("/startupvarsity", payload);
  return res.data;
}
