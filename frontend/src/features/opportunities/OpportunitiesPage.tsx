import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createOpportunity, listOpportunities } from "@/api/opportunities.api";
import { timeAgo } from "@/lib/roo-utils";
import type { CreateOpportunityPayload } from "@/types/api";
import type { Opportunity } from "@/types/models";

type KindFilter = "" | "hiring" | "seeking";

const INITIAL_FORM: CreateOpportunityPayload = {
  kind: "hiring",
  title: "",
  description: "",
  expertise_domain: "",
  location: "",
  company: "",
};

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="display text-xl leading-snug text-foreground">{opp.title}</h3>
        <span
          className={[
            "chip shrink-0",
            opp.kind === "hiring"
              ? "border-accent/40 text-accent"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {opp.kind === "hiring" ? "Hiring" : "Seeking"}
        </span>
      </div>

      {/* Author + time */}
      <p className="text-xs text-muted-foreground">
        {opp.author?.full_name ?? "Anonymous"}
        {opp.created_at ? (
          <>
            {" · "}
            {timeAgo(opp.created_at)}
          </>
        ) : null}
      </p>

      {/* Description */}
      {opp.description && (
        <p className="text-sm text-foreground/80 line-clamp-3">{opp.description}</p>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
        {(opp.location || opp.company) && (
          <span className="text-xs text-muted-foreground">
            {[opp.company, opp.location].filter(Boolean).join(" · ")}
          </span>
        )}
        {opp.expertise_domain && (
          <span className="chip text-xs ml-auto">{opp.expertise_domain}</span>
        )}
      </div>
    </div>
  );
}

export function OpportunitiesPage() {
  const qc = useQueryClient();
  const [kindFilter, setKindFilter] = useState<KindFilter>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateOpportunityPayload>(INITIAL_FORM);
  const [error, setError] = useState("");

  const set = <K extends keyof CreateOpportunityPayload>(
    k: K,
    v: CreateOpportunityPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const { data: opps, isLoading } = useQuery({
    queryKey: ["opportunities", kindFilter],
    queryFn: () =>
      listOpportunities({ kind: kindFilter || undefined }),
  });

  const create = useMutation({
    mutationFn: () => createOpportunity(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      setShowForm(false);
      setForm(INITIAL_FORM);
      setError("");
    },
    onError: () => setError("Could not post opportunity. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    create.mutate();
  };

  const filterTabs: { key: KindFilter; label: string }[] = [
    { key: "", label: "All" },
    { key: "hiring", label: "Hiring" },
    { key: "seeking", label: "Seeking" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* Page header */}
      <div className="space-y-2">
        <p className="chip text-xs tracking-widest uppercase">Opportunities</p>
        <h1 className="display text-4xl md:text-5xl text-foreground leading-tight">
          Hiring &amp; Seeking —<br className="hidden sm:block" /> in the open.
        </h1>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setKindFilter(tab.key)}
              className={[
                "chip cursor-pointer transition-colors",
                kindFilter === tab.key
                  ? "border-foreground bg-foreground text-background"
                  : "hover:border-foreground/40",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Post button */}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="chip border-accent/60 text-accent hover:bg-accent/10 transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Post an opportunity"}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <h2 className="display text-2xl text-foreground">Post an opportunity</h2>

          {/* Kind select */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as "hiring" | "seeking")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="hiring">I'm hiring / have an opening</option>
              <option value="seeking">I'm looking for a role</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={
                form.kind === "hiring" ? "Senior DevOps Engineer" : "Seeking Cloud role"
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Add context, requirements, or what you're looking for…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />
          </div>

          {/* Expertise domain */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expertise domain
            </label>
            <input
              type="text"
              value={form.expertise_domain ?? ""}
              onChange={(e) => set("expertise_domain", e.target.value)}
              placeholder="e.g. Cloud, DevOps, Data Science"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {/* Company + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Company
              </label>
              <input
                type="text"
                value={form.company ?? ""}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Location
              </label>
              <input
                type="text"
                value={form.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Bangalore / Remote"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={create.isPending || !form.title.trim()}
            className="w-full rounded-xl border border-foreground bg-foreground text-background py-2.5 text-sm font-medium transition-opacity disabled:opacity-50 cursor-pointer hover:opacity-90"
          >
            {create.isPending ? "Posting…" : "Post opportunity"}
          </button>
        </form>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="cx-spinner" />
        </div>
      ) : !opps?.length ? (
        <div className="flex justify-center py-20">
          <p className="text-muted-foreground text-sm">
            No opportunities here yet. Be the first to post one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opps.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
