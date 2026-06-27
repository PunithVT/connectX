import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { applyForResources, listProjects } from "@/api/startupvarsity.api";
import { timeAgo } from "@/lib/format";
import type { StartupApplyPayload } from "@/types/api";

const stageOptions = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "mvp", label: "MVP" },
  { value: "revenue", label: "Revenue" },
  { value: "scaling", label: "Scaling" },
];

// Matches backend StartupProject.status vocabulary.
const statusColor: Record<string, string> = {
  submitted: "var(--rooman-accent)",
  under_review: "var(--rooman-blue)",
  approved: "var(--rooman-green)",
  rejected: "#bdb8ad",
};

const statusLabel: Record<string, string> = {
  submitted: "submitted",
  under_review: "under review",
  approved: "approved",
  rejected: "rejected",
};

export function StartupVarsityPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const projects = useQuery({ queryKey: ["startup-projects"], queryFn: listProjects });

  const [form, setForm] = useState<StartupApplyPayload>({
    name: "",
    pitch: "",
    stage: "idea",
    resources_requested: "",
  });
  const set = <K extends keyof StartupApplyPayload>(k: K, v: StartupApplyPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const apply = useMutation({
    mutationFn: () => applyForResources(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["startup-projects"] });
      setOpen(false);
      toast.push("Application submitted to StartupVarsity!", "success");
    },
    onError: () => toast.push("Could not submit application.", "error"),
  });

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">StartupVarsity</h1>
        <Button onClick={() => setOpen(true)}>+ Apply for resources</Button>
      </div>

      <Card surface="skeu-bench">
        <strong>🚀 Build your product with Rooman's resources.</strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Alumni founders can apply for compute, mentorship, and lab access to develop
          their products under StartupVarsity. Pitch your idea and request what you need.
        </p>
      </Card>

      {projects.isLoading ? (
        <div className="cx-spinner" />
      ) : !projects.data?.length ? (
        <p className="muted">No projects yet — be the first to apply!</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {projects.data.map((p) => (
            <Card key={p.id} surface="brutalist">
              <div className="row between wrap gap-2">
                <Badge>{p.stage}</Badge>
                <Badge color={statusColor[p.status] ?? "var(--rooman-accent)"}>
                  {statusLabel[p.status] ?? p.status}
                </Badge>
              </div>
              <h3 style={{ margin: "10px 0 4px" }}>{p.name}</h3>
              {p.pitch && <p className="small">{p.pitch}</p>}
              {p.resources_requested && (
                <p className="small muted" style={{ marginTop: 8 }}>
                  Needs: {p.resources_requested}
                </p>
              )}
              <div className="row gap-2 mt-4" style={{ alignItems: "center" }}>
                <Avatar name={p.owner?.full_name} size={26} />
                <span className="small">{p.owner?.full_name ?? "Founder"}</span>
                <span className="small muted" style={{ marginLeft: "auto" }}>
                  {timeAgo(p.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Apply to StartupVarsity">
        <div className="stack gap-3">
          <Input
            label="Project / startup name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <Textarea
            label="Pitch"
            value={form.pitch ?? ""}
            onChange={(e) => set("pitch", e.target.value)}
            rows={3}
            placeholder="What are you building and for whom?"
          />
          <Select
            label="Stage"
            options={stageOptions}
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
          />
          <Textarea
            label="Resources requested"
            value={form.resources_requested ?? ""}
            onChange={(e) => set("resources_requested", e.target.value)}
            rows={2}
            placeholder="e.g. GPU compute, mentor for go-to-market, lab space"
          />
          <Button
            block
            onClick={() => form.name.trim() && apply.mutate()}
            disabled={apply.isPending || !form.name.trim()}
          >
            {apply.isPending ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
