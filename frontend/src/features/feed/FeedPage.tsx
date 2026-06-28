import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/roo/Avatar";
import { listFeed, createPost, likePost } from "@/api/feed.api";
import { useCurrentUser } from "@/features/auth/useAuth";
import {
  timeAgo,
  POST_TYPE_LABELS,
  POST_TYPE_FROM_LABEL,
  DISPLAY_CATEGORIES,
  initials,
  nameToHue,
} from "@/lib/roo-utils";
import type { PostType } from "@/types/models";

type DisplayFilter = "All" | (typeof DISPLAY_CATEGORIES)[number];

export function FeedPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<(typeof DISPLAY_CATEGORIES)[number]>("General");
  const [filter, setFilter] = useState<DisplayFilter>("All");
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const { data: posts = [] } = useQuery({
    queryKey: ["feed"],
    queryFn: () => listFeed(50, 0),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const visible =
    filter === "All"
      ? posts
      : posts.filter((p) => POST_TYPE_LABELS[p.post_type as PostType] === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({
      body: content.trim(),
      post_type: POST_TYPE_FROM_LABEL[category],
    });
    setContent("");
  }

  const myName = user?.full_name ?? "";

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Community feed
      </div>
      <h1 className="mt-2 display text-4xl">What's happening in the network</h1>

      {/* Compose */}
      <form onSubmit={submit} className="mt-8 rounded-3xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <Avatar initials={initials(myName) || "?"} hue={nameToHue(myName)} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, a job, or a question…"
            rows={3}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-1.5">
            {DISPLAY_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`chip transition-colors ${
                  category === c ? "border-accent bg-accent text-accent-foreground" : ""
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || !content.trim()}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {createMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {/* Filter */}
      <div className="mt-8 flex flex-wrap gap-1.5">
        {(["All", ...DISPLAY_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`chip ${
              filter === c ? "border-foreground bg-foreground text-background" : ""
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {visible.map((p) => {
          const name = p.author?.full_name ?? "Unknown";
          const isLiked = liked[p.id];
          return (
            <article key={p.id} className="rounded-3xl border border-border bg-card p-5">
              <header className="flex items-center gap-3">
                <Avatar initials={initials(name)} hue={nameToHue(name)} size={42} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{name}</span>
                  <div className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</div>
                </div>
                <span className="chip">
                  {POST_TYPE_LABELS[p.post_type as PostType] ?? p.post_type}
                </span>
              </header>
              <p className="mt-4 text-[15px] leading-relaxed">{p.body}</p>
              <footer className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
                <button
                  onClick={() => {
                    setLiked((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                    likeMutation.mutate(p.id);
                  }}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isLiked ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{isLiked ? "♥" : "♡"}</span>
                  {p.likes + (isLiked ? 1 : 0)}
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <span>💬</span>{" "}
                  {p.comments.length > 0 ? p.comments.length : "Comment"}
                </button>
              </footer>
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </section>
  );
}
