import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Card, Modal } from "@/components/ui";
import { OpportunityCard } from "./OpportunityCard";
import {
  createOpportunity,
  listMyApplications,
  listOpportunities,
} from "@/api/opportunities.api";
import { timeAgo } from "@/lib/roo-utils";
import type { CreateOpportunityPayload } from "@/types/api";

type KindFilter = "" | "hiring" | "seeking";

const INITIAL_FORM: CreateOpportunityPayload = {
  kind: "hiring",
  title: "",
  description: "",
  expertise_domain: "",
  location: "",
  company: "",
};

const APP_STATUS_COLOR: Record<string, string> = {
  applied: "var(--rooman-blue)",
  shortlisted: "var(--rooman-accent)",
  hired: "var(--rooman-green)",
  rejected: "#bdb8ad",
};

export function OpportunitiesPage() {
  const qc = useQueryClient();
  const [kindFilter, setKindFilter] = useState<KindFilter>("");
  const [domain, setDomain] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [myAppsOpen, setMyAppsOpen] = useState(false);
  const [form, setForm] = useState<CreateOpportunityPayload>(INITIAL_FORM);
  const [error, setError] = useState("");

  const set = <K extends keyof CreateOpportunityPayload>(
    k: K,
    v: CreateOpportunityPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const { data: opps, isLoading } = useQuery({
    queryKey: ["opportunities", kindFilter, domain],
    queryFn: () =>
      listOpportunities({
        kind: kindFilter || undefined,
        domain: domain || undefined,
      }),
  });

  const myApps = useQuery({
    queryKey: ["my-applications"],
    queryFn: listMyApplications,
    enabled: myAppsOpen,
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

        {/* Domain filter + actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Filter by domain…"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            onClick={() => setMyAppsOpen(true)}
            className="chip cursor-pointer transition-colors hover:border-foreground/40"
          >
            My applications
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="chip border-accent/60 text-accent hover:bg-accent/10 transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "+ Post an opportunity"}
          </button>
        </div>
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

      {/* My applications modal */}
      <Modal
        open={myAppsOpen}
        onClose={() => setMyAppsOpen(false)}
        title="My applications"
      >
        {myApps.isLoading ? (
          <div className="cx-spinner" />
        ) : !myApps.data?.length ? (
          <p className="muted">
            You haven't applied to anything yet. Apply from any hiring post.
          </p>
        ) : (
          <div className="stack gap-3">
            {myApps.data.map((a) => (
              <Card key={a.id} surface="neu">
                <div className="row between wrap gap-2" style={{ alignItems: "center" }}>
                  <div className="stack">
                    <strong>Application #{a.id}</strong>
                    <span className="small muted">
                      {a.referrer
                        ? `Referred by ${a.referrer.full_name} · `
                        : ""}
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                  <Badge
                    color={APP_STATUS_COLOR[a.status] ?? "var(--surface-raised)"}
                    style={{ color: a.status === "shortlisted" ? "var(--rooman-ink)" : "#fff" }}
                  >
                    {a.status}
                  </Badge>
                </div>
                {a.note && <p className="small mt-2">{a.note}</p>}
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
