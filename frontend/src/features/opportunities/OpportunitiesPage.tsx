import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Input, Modal, Select, Tabs, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { OpportunityCard } from "./OpportunityCard";
import { createOpportunity, listOpportunities } from "@/api/opportunities.api";
import { EXPERTISE_DOMAINS } from "@/lib/validators";
import type { CreateOpportunityPayload } from "@/types/api";

const domainOptions = [
  { value: "", label: "All domains" },
  ...EXPERTISE_DOMAINS.map((d) => ({ value: d, label: d })),
];

export function OpportunitiesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<"" | "hiring" | "seeking">("");
  const [domain, setDomain] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const opps = useQuery({
    queryKey: ["opportunities", kind, domain],
    queryFn: () =>
      listOpportunities({ kind: kind || undefined, domain: domain || undefined }),
  });

  const [form, setForm] = useState<CreateOpportunityPayload>({
    kind: "hiring",
    title: "",
    description: "",
    expertise_domain: EXPERTISE_DOMAINS[0],
    location: "",
    company: "",
  });
  const set = <K extends keyof CreateOpportunityPayload>(
    k: K,
    v: CreateOpportunityPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => createOpportunity(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      setModalOpen(false);
      setForm({ ...form, title: "", description: "" });
      toast.push("Posted! We'll notify matching alumni.", "success");
    },
    onError: () => toast.push("Could not post opportunity.", "error"),
  });

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">Opportunities</h1>
        <Button onClick={() => setModalOpen(true)}>+ Post an opportunity</Button>
      </div>

      <Card surface="brutalist">
        <div className="row between wrap gap-3">
          <Tabs
            tabs={[
              { key: "", label: "All" },
              { key: "hiring", label: "Hiring" },
              { key: "seeking", label: "Seeking" },
            ]}
            active={kind}
            onChange={(k) => setKind(k as typeof kind)}
          />
          <div style={{ minWidth: 200 }}>
            <Select
              options={domainOptions}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {opps.isLoading ? (
        <div className="cx-spinner" />
      ) : !opps.data?.length ? (
        <p className="muted">No opportunities here yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {opps.data.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post an opportunity">
        <div className="stack gap-3">
          <Select
            label="Type"
            options={[
              { value: "hiring", label: "I'm hiring / have an opening" },
              { value: "seeking", label: "I'm looking for a role" },
            ]}
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as "hiring" | "seeking")}
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={form.kind === "hiring" ? "Senior DevOps Engineer" : "Seeking Cloud role"}
          />
          <Textarea
            label="Description"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
          <Select
            label="Expertise domain"
            options={EXPERTISE_DOMAINS.map((d) => ({ value: d, label: d }))}
            value={form.expertise_domain}
            onChange={(e) => set("expertise_domain", e.target.value)}
          />
          <div className="row gap-3 wrap">
            <Input
              label="Company"
              value={form.company ?? ""}
              onChange={(e) => set("company", e.target.value)}
            />
            <Input
              label="Location"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <Button
            block
            onClick={() => form.title.trim() && create.mutate()}
            disabled={create.isPending || !form.title.trim()}
          >
            {create.isPending ? "Posting…" : "Post opportunity"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
