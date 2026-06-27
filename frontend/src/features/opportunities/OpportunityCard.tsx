import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/useAuth";
import { listConnections } from "@/api/connections.api";
import {
  applyToOpportunity,
  listApplications,
  referCandidate,
  updateApplicationStatus,
} from "@/api/opportunities.api";
import { timeAgo } from "@/lib/format";
import type { Opportunity } from "@/types/models";

const STATUS_COLOR: Record<string, string> = {
  applied: "var(--rooman-blue)",
  shortlisted: "var(--rooman-accent)",
  hired: "var(--rooman-green)",
  rejected: "#bdb8ad",
};
const STATUSES = ["applied", "shortlisted", "hired", "rejected"];

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useCurrentUser();
  const hiring = opp.kind === "hiring";
  const isOwn = !!me && opp.author?.id === me.id;
  const isOpen = opp.status === "open";

  const [applyOpen, setApplyOpen] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [applicantsOpen, setApplicantsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [referNote, setReferNote] = useState("");
  const [candidate, setCandidate] = useState("");

  const connections = useQuery({
    queryKey: ["connections"],
    queryFn: listConnections,
    enabled: referOpen,
  });
  const applications = useQuery({
    queryKey: ["applications", opp.id],
    queryFn: () => listApplications(opp.id),
    enabled: applicantsOpen,
  });

  const apply = useMutation({
    mutationFn: () => applyToOpportunity(opp.id, note.trim() || undefined),
    onSuccess: () => {
      setApplyOpen(false);
      setNote("");
      toast.push("Application sent! The poster has been notified.", "success");
    },
    onError: () => toast.push("Could not apply (already applied?).", "error"),
  });

  const refer = useMutation({
    mutationFn: () =>
      referCandidate(opp.id, Number(candidate), referNote.trim() || undefined),
    onSuccess: () => {
      setReferOpen(false);
      setReferNote("");
      setCandidate("");
      toast.push("Referral submitted. Thank you!", "success");
    },
    onError: () =>
      toast.push("Could not refer (connect with them first?).", "error"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications", opp.id] }),
    onError: () => toast.push("Could not update status.", "error"),
  });

  return (
    <Card surface="brutalist">
      <div className="row between wrap gap-2">
        <Badge
          color={hiring ? "var(--rooman-primary)" : "var(--rooman-green)"}
          style={{ color: "#fff" }}
        >
          {hiring ? "Hiring" : "Seeking"}
        </Badge>
        <span className="small muted">{timeAgo(opp.created_at)}</span>
      </div>

      <h3 style={{ margin: "10px 0 4px" }}>{opp.title}</h3>
      <div className="row wrap gap-2 small muted">
        {opp.company && <span>{opp.company}</span>}
        {opp.expertise_domain && <span>{opp.expertise_domain}</span>}
        {opp.location && <span>{opp.location}</span>}
      </div>

      {opp.description && <p style={{ marginTop: 10 }}>{opp.description}</p>}

      <div className="row gap-2 mt-4" style={{ alignItems: "center" }}>
        <Avatar name={opp.author?.full_name} size={28} />
        <span className="small">{opp.author?.full_name ?? "Alumnus"}</span>
        {opp.status !== "open" && (
          <Badge color="#bdb8ad" style={{ marginLeft: "auto" }}>
            {opp.status}
          </Badge>
        )}
      </div>

      {/* Action row */}
      {hiring && isOpen && (
        <div className="row wrap gap-2 mt-4">
          {isOwn ? (
            <Button variant="secondary" onClick={() => setApplicantsOpen(true)}>
              View applicants
            </Button>
          ) : (
            <>
              <Button onClick={() => setApplyOpen(true)}>Apply</Button>
              <Button variant="secondary" onClick={() => setReferOpen(true)}>
                Refer someone
              </Button>
            </>
          )}
        </div>
      )}

      {/* Apply modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply · ${opp.title}`}>
        <div className="stack gap-3">
          <p className="small muted">
            Your profile is shared with {opp.author?.full_name ?? "the poster"}. Add a
            quick note on why you're a fit.
          </p>
          <Textarea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="I led a 5-person SRE team and shipped…"
          />
          <Button block onClick={() => apply.mutate()} disabled={apply.isPending}>
            {apply.isPending ? "Sending…" : "Submit application"}
          </Button>
        </div>
      </Modal>

      {/* Refer modal */}
      <Modal open={referOpen} onClose={() => setReferOpen(false)} title="Refer a connection">
        <div className="stack gap-3">
          <p className="small muted">
            Refer someone from your network. They'll be added as an applicant and notified.
          </p>
          {connections.isLoading ? (
            <div className="cx-spinner" />
          ) : !connections.data?.length ? (
            <p className="muted">
              You have no connections yet. Connect with alumni to refer them.
            </p>
          ) : (
            <Select
              label="Candidate"
              options={[
                { value: "", label: "Select a connection…" },
                ...connections.data.map((c) => ({
                  value: String(c.user.id),
                  label: c.user.full_name + (c.current_company ? ` · ${c.current_company}` : ""),
                })),
              ]}
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            />
          )}
          <Textarea
            label="Why you're referring them (optional)"
            value={referNote}
            onChange={(e) => setReferNote(e.target.value)}
            rows={3}
          />
          <Button
            block
            onClick={() => candidate && refer.mutate()}
            disabled={refer.isPending || !candidate}
          >
            {refer.isPending ? "Referring…" : "Submit referral"}
          </Button>
        </div>
      </Modal>

      {/* Applicants modal (owner) */}
      <Modal
        open={applicantsOpen}
        onClose={() => setApplicantsOpen(false)}
        title={`Applicants · ${opp.title}`}
      >
        {applications.isLoading ? (
          <div className="cx-spinner" />
        ) : !applications.data?.length ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <div className="stack gap-3">
            {applications.data.map((a) => (
              <Card key={a.id} surface="neu">
                <div className="row between wrap gap-2" style={{ alignItems: "center" }}>
                  <div className="row gap-2" style={{ alignItems: "center" }}>
                    <Avatar name={a.applicant?.full_name} size={36} />
                    <div className="stack">
                      <strong>{a.applicant?.full_name ?? "Applicant"}</strong>
                      {a.referrer && (
                        <span className="small muted">
                          Referred by {a.referrer.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    color={STATUS_COLOR[a.status] ?? "var(--surface-raised)"}
                    style={{ color: a.status === "shortlisted" ? "var(--rooman-ink)" : "#fff" }}
                  >
                    {a.status}
                  </Badge>
                </div>
                {a.note && <p className="small mt-2">{a.note}</p>}
                <div style={{ maxWidth: 200 }} className="mt-2">
                  <Select
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                    value={a.status}
                    onChange={(e) =>
                      setStatus.mutate({ id: a.id, status: e.target.value })
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}
