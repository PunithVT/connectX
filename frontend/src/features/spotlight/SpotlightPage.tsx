import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Input, Modal, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  likeStory,
  listSpotlights,
  shareStory,
  type CreateSpotlightPayload,
} from "@/api/spotlight.api";
import type { Spotlight } from "@/types/models";

function StoryCard({ story }: { story: Spotlight }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () => likeStory(story.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spotlights"] }),
  });

  return (
    <Card surface="skeu-cert" style={{ position: "relative" }}>
      {story.is_featured && (
        <Badge
          color="var(--rooman-accent)"
          style={{ position: "absolute", top: 12, right: 12 }}
        >
          ⭐ Featured
        </Badge>
      )}
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <span style={{ fontSize: 40 }}>{story.cover_emoji ?? "🌟"}</span>
        <div className="stack">
          <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
            {story.title}
          </strong>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <Avatar name={story.user?.full_name} size={22} />
            <span className="small muted">
              {story.user?.full_name ?? "Rooman alumnus"}
              {story.program_trained ? ` · ${story.program_trained}` : ""}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4" style={{ whiteSpace: "pre-wrap" }}>
        {story.story}
      </p>

      <div className="row between mt-4" style={{ alignItems: "center" }}>
        <Button variant="ghost" onClick={() => like.mutate()} disabled={like.isPending}>
          ❤️ {story.likes}
        </Button>
      </div>
    </Card>
  );
}

const emptyForm: CreateSpotlightPayload = {
  title: "",
  story: "",
  program_trained: "",
  cover_emoji: "🌟",
};

export function SpotlightPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateSpotlightPayload>(emptyForm);

  const stories = useQuery({
    queryKey: ["spotlights"],
    queryFn: () => listSpotlights(false),
  });

  const set = <K extends keyof CreateSpotlightPayload>(
    k: K,
    v: CreateSpotlightPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => shareStory(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spotlights"] });
      setModalOpen(false);
      setForm(emptyForm);
      toast.push("Thanks for sharing your story!", "success");
    },
    onError: () => toast.push("Could not share your story.", "error"),
  });

  const canSubmit = form.title.trim() && form.story.trim();

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">Alumni spotlight</h1>
        <Button onClick={() => setModalOpen(true)}>+ Share your story</Button>
      </div>
      <p className="muted">
        Real journeys from Rooman alumni — celebrate wins, inspire the next batch.
      </p>

      {stories.isLoading ? (
        <div className="cx-spinner" />
      ) : !stories.data?.length ? (
        <p className="muted">No stories yet. Be the first to share yours!</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {stories.data.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Share your story">
        <div className="stack gap-3">
          <Input
            label="Headline"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="From Rooman classroom to Razorpay SDE-2"
          />
          <Textarea
            label="Your story"
            value={form.story}
            onChange={(e) => set("story", e.target.value)}
            rows={6}
            placeholder="How did Rooman shape your journey?"
          />
          <div className="row gap-3 wrap">
            <Input
              label="Program trained"
              value={form.program_trained ?? ""}
              onChange={(e) => set("program_trained", e.target.value)}
            />
            <Input
              label="Cover emoji"
              value={form.cover_emoji ?? ""}
              onChange={(e) => set("cover_emoji", e.target.value)}
            />
          </div>
          <Button
            block
            onClick={() => canSubmit && create.mutate()}
            disabled={create.isPending || !canSubmit}
          >
            {create.isPending ? "Sharing…" : "Share story"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
