import { apiClient } from "./client";
import type { Community, GroupPost } from "@/types/models";

export async function listCommunities(): Promise<Community[]> {
  const res = await apiClient.get<Community[]>("/community");
  return res.data;
}

export async function joinCommunity(id: number): Promise<Community> {
  const res = await apiClient.post<Community>(`/community/${id}/join`);
  return res.data;
}

export async function listGroupPosts(communityId: number): Promise<GroupPost[]> {
  const res = await apiClient.get<GroupPost[]>(`/community/${communityId}/posts`);
  return res.data;
}

export async function createGroupPost(
  communityId: number,
  body: string,
): Promise<GroupPost> {
  const res = await apiClient.post<GroupPost>(`/community/${communityId}/posts`, {
    body,
  });
  return res.data;
}

export async function deleteGroupPost(
  communityId: number,
  postId: number,
): Promise<void> {
  await apiClient.delete(`/community/${communityId}/posts/${postId}`);
}
