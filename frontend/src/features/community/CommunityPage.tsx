import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCommunity,
  joinCommunity,
  listCommunities,
  type CreateCommunityPayload,
} from "@/api/community.api";

export function CommunityPage() {
  const qc = useQueryClient();

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: listCommunities,
  });

  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());

  const join = useMutation({
    mutationFn: (id: number) => joinCommunity(id),
    onSuccess: (_data, id) => {
      setJoinedIds((prev) => new Set(prev).add(id));
      qc.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCommunityPayload>({
    name: "",
    slug: "",
    description: "",
  });

  const create = useMutation({
    mutationFn: (payload: CreateCommunityPayload) => createCommunity(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      setShowForm(false);
      setForm({ name: "", slug: "", description: "" });
    },
  });

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    create.mutate(form);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="chip mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Community
          </p>
          <h1 className="display text-4xl text-foreground">Find your people.</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          {showForm ? "Cancel" : "Create community"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl border border-border bg-card p-6"
        >
          <h2 className="display mb-4 text-xl text-foreground">New community</h2>
          <div className="flex flex-col gap-3">
            <input
              required
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Community name"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              required
              name="slug"
              value={form.slug}
              onChange={handleFormChange}
              placeholder="slug (e.g. batch-2022)"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Description (optional)"
              rows={3}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
            />
            <button
              type="submit"
              disabled={create.isPending}
              className="self-end rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create →"}
            </button>
          </div>
        </form>
      )}

      {/* Community grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      ) : communities.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No communities yet. Be the first to create one.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => {
            const joined = joinedIds.has(c.id);
            return (
              <div
                key={c.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
              >
                <h3 className="display mb-1 text-xl text-foreground">{c.name}</h3>
                {c.description && (
                  <p className="mb-4 flex-1 text-sm text-muted-foreground leading-relaxed">
                    {c.description}
                  </p>
                )}
                {!c.description && <div className="flex-1" />}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="chip text-xs text-muted-foreground">
                    {c.member_count} {c.member_count === 1 ? "member" : "members"}
                  </span>
                  <button
                    onClick={() => !joined && join.mutate(c.id)}
                    disabled={join.isPending || joined}
                    className={[
                      "rounded-xl px-4 py-1.5 text-sm font-medium transition-colors",
                      joined
                        ? "border border-border bg-card text-muted-foreground cursor-default"
                        : "border border-accent bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
                    ].join(" ")}
                  >
                    {joined ? "Joined" : "Join →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
