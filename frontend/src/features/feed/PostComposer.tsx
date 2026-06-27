import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { createPost } from "@/api/feed.api";
import type { PostType } from "@/types/models";

const typeOptions: Array<{ value: PostType; label: string }> = [
  { value: "update", label: "📢 Sharing an update" },
  { value: "doing", label: "🛠️ What I'm working on" },
  { value: "looking", label: "🔎 What I'm looking for" },
];

export function PostComposer() {
  const qc = useQueryClient();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<PostType>("update");

  const create = useMutation({
    mutationFn: () => createPost({ body, post_type: postType }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.push("Posted to the network!", "success");
    },
    onError: () => toast.push("Could not post.", "error"),
  });

  return (
    <Card surface="brutalist">
      <div className="stack gap-3">
        <Select
          label="Post type"
          options={typeOptions}
          value={postType}
          onChange={(e) => setPostType(e.target.value as PostType)}
        />
        <Textarea
          label="What's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share progress, a hiring need, or what you're looking for…"
          rows={3}
        />
        <div className="row between">
          <span className="small muted">Visible to all connectX alumni</span>
          <Button
            onClick={() => body.trim() && create.mutate()}
            disabled={create.isPending || !body.trim()}
          >
            {create.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
