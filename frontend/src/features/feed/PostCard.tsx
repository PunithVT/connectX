import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Input } from "@/components/ui";
import { addComment, likePost } from "@/api/feed.api";
import { timeAgo } from "@/lib/format";
import type { Post, PostType } from "@/types/models";

const typeMeta: Record<PostType, { label: string; color: string }> = {
  update: { label: "Update", color: "var(--rooman-accent)" },
  doing: { label: "Working on", color: "var(--rooman-blue)" },
  looking: { label: "Looking for", color: "var(--rooman-green)" },
};

export function PostCard({ post }: { post: Post }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");

  const like = useMutation({
    mutationFn: () => likePost(post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const submitComment = useMutation({
    mutationFn: () => addComment(post.id, comment),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const meta = typeMeta[post.post_type] ?? typeMeta.update;

  return (
    <Card surface="brutalist">
      <div className="row gap-3" style={{ alignItems: "flex-start" }}>
        <Avatar name={post.author?.full_name} size={44} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row between wrap gap-2">
            <Link
              to={post.author ? `/profile/${post.author.id}` : "#"}
              style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}
            >
              {post.author?.full_name ?? "Alumnus"}
            </Link>
            <div className="row gap-2">
              <Badge color={meta.color} style={{ color: "#fff" }}>
                {meta.label}
              </Badge>
              <span className="small muted">{timeAgo(post.created_at)}</span>
            </div>
          </div>
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{post.body}</p>

          <div className="row gap-3 mt-2">
            <button
              className="nb-badge"
              style={{ cursor: "pointer", background: "var(--surface-raised)" }}
              onClick={() => like.mutate()}
            >
              ♥ {post.likes}
            </button>
            <button
              className="nb-badge"
              style={{ cursor: "pointer", background: "var(--surface-raised)" }}
              onClick={() => setShowComments((s) => !s)}
            >
              {post.comments.length}
            </button>
          </div>

          {showComments && (
            <div className="stack gap-2 mt-4">
              {post.comments.map((c) => (
                <div
                  key={c.id}
                  className="row gap-2"
                  style={{ alignItems: "flex-start" }}
                >
                  <Avatar name={c.author?.full_name} size={28} />
                  <div
                    style={{
                      background: "var(--surface-raised)",
                      border: "2px solid var(--rooman-ink)",
                      padding: "6px 10px",
                      flex: 1,
                    }}
                  >
                    <span className="small" style={{ fontWeight: 700 }}>
                      {c.author?.full_name ?? "Alumnus"}
                    </span>
                    <p className="small" style={{ margin: "2px 0 0" }}>
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
              <div className="row gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && comment.trim()) submitComment.mutate();
                  }}
                />
                <Button
                  onClick={() => comment.trim() && submitComment.mutate()}
                  disabled={submitComment.isPending || !comment.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
