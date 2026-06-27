import { useQuery } from "@tanstack/react-query";

import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";
import { listFeed } from "@/api/feed.api";

export function FeedPage() {
  const feed = useQuery({ queryKey: ["feed"], queryFn: () => listFeed(30, 0) });

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Feed</h1>
      <PostComposer />

      {feed.isLoading ? (
        <div className="cx-spinner" />
      ) : feed.isError ? (
        <p className="muted">Could not load the feed. Try again shortly.</p>
      ) : !feed.data?.length ? (
        <p className="muted">No posts yet — be the first to share something!</p>
      ) : (
        <div className="stack gap-4">
          {feed.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
