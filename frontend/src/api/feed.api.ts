import { apiClient } from "./client";
import type { CreatePostPayload } from "@/types/api";
import type { Comment, Post } from "@/types/models";

export async function listFeed(limit = 20, offset = 0): Promise<Post[]> {
  const res = await apiClient.get<Post[]>("/feed", { params: { limit, offset } });
  return res.data;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const res = await apiClient.post<Post>("/feed", payload);
  return res.data;
}

export async function addComment(postId: number, body: string): Promise<Comment> {
  const res = await apiClient.post<Comment>(`/feed/${postId}/comments`, { body });
  return res.data;
}

export async function likePost(postId: number): Promise<Post> {
  const res = await apiClient.post<Post>(`/feed/${postId}/like`);
  return res.data;
}
