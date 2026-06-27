import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Button, Card, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/useAuth";
import { timeAgo } from "@/lib/format";
import {
  createGroupPost,
  deleteGroupPost,
  joinCommunity,
  listCommunities,
  listGroupPosts,
} from "@/api/community.api";

export function CommunityDetailPage() {
  const { communityId } = useParams();
  const cid = Number(communityId);
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useCurrentUser();
  const [draft, setDraft] = useState("");

  const communities = useQuery({
    queryKey: ["communities"],
    queryFn: listCommunities,
  });
  const community = communities.data?.find((c) => c.id === cid);

  const posts = useQuery({
    queryKey: ["group-posts", cid],
    queryFn: () => listGroupPosts(cid),
  });

  const join = useMutation({
    mutationFn: () => joinCommunity(cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast.push("Joined! You can post now.", "success");
    },
  });

  const post = useMutation({
    mutationFn: () => createGroupPost(cid, draft.trim()),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["group-posts", cid] });
    },
    onError: () => toast.push("Join the group to post.", "error"),
  });

  const remove = useMutation({
    mutationFn: (postId: number) => deleteGroupPost(cid, postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-posts", cid] }),
  });

  return (
    <div className="stack gap-6">
      <Link to="/community" className="small" style={{ color: "var(--rooman-blue)" }}>
        ← All communities
      </Link>

      <div className="row between wrap gap-2">
        <h1 className="page-title">{community?.name ?? "Community"}</h1>
        <Button variant="secondary" onClick={() => join.mutate()} disabled={join.isPending}>
          Join group
        </Button>
      </div>
      {community?.description && <p className="muted">{community.description}</p>}

      <Card surface="brutalist">
        <h3 style={{ marginTop: 0 }}>Start a discussion</h3>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Share something or ask the group a question…"
        />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button
            className="mt-2"
            onClick={() => draft.trim() && post.mutate()}
            disabled={post.isPending || !draft.trim()}
          >
            Post
          </Button>
        </div>
      </Card>

      {posts.isLoading ? (
        <div className="cx-spinner" />
      ) : !posts.data?.length ? (
        <p className="muted">No posts yet — kick off the conversation.</p>
      ) : (
        <div className="stack gap-3">
          {posts.data.map((p) => (
            <Card key={p.id} surface="brutalist">
              <div className="row between">
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <Avatar name={p.author?.full_name} size={32} />
                  <div className="stack">
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>
                      {p.author?.full_name ?? "Alumnus"}
                    </strong>
                    <span className="small muted">{timeAgo(p.created_at)}</span>
                  </div>
                </div>
                {p.author_id === me?.id && (
                  <Button
                    variant="ghost"
                    onClick={() => remove.mutate(p.id)}
                    disabled={remove.isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <p className="mt-2" style={{ whiteSpace: "pre-wrap" }}>
                {p.body}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
