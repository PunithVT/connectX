import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, Input, Tabs, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { bulkInvite, createInvite, listInvites } from "@/api/invites.api";
import { useCurrentUser } from "@/features/auth/useAuth";
import { isEmail } from "@/lib/validators";
import { timeAgo } from "@/lib/format";

const statusColor: Record<string, string> = {
  pending: "var(--rooman-accent)",
  accepted: "var(--rooman-green)",
  expired: "#bdb8ad",
};

export function InviteAdminPage() {
  const { data: me, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [filter, setFilter] = useState<string>("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [program, setProgram] = useState("");
  const [bulkText, setBulkText] = useState("");

  const invites = useQuery({
    queryKey: ["invites", filter],
    queryFn: () => listInvites(filter || undefined),
    enabled: me?.role === "admin",
  });

  const single = useMutation({
    mutationFn: () =>
      createInvite({ email, full_name: fullName || undefined, program_trained: program || undefined }),
    onSuccess: () => {
      toast.push(`Invite sent to ${email}`, "success");
      setEmail("");
      setFullName("");
      setProgram("");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: () => toast.push("Could not send invite (already invited?).", "error"),
  });

  const bulk = useMutation({
    mutationFn: () => {
      const rows = bulkText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [e, name, prog] = line.split(",").map((s) => s?.trim());
          return { email: e, full_name: name || undefined, program_trained: prog || undefined };
        })
        .filter((r) => isEmail(r.email));
      return bulkInvite(rows);
    },
    onSuccess: (created) => {
      toast.push(`Queued ${created.length} invite(s).`, "success");
      setBulkText("");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: () => toast.push("Bulk invite failed.", "error"),
  });

  if (isLoading) return <div className="cx-spinner" />;
  if (me?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Invite alumni</h1>

      <Card surface="brutalist">
        <Tabs
          tabs={[
            { key: "single", label: "Single invite" },
            { key: "bulk", label: "Bulk invite" },
          ]}
          active={tab}
          onChange={(k) => setTab(k as "single" | "bulk")}
        />

        {tab === "single" ? (
          <div className="stack gap-3">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alumnus@example.com"
            />
            <Input
              label="Full name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Program trained (optional)"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="e.g. AWS Cloud Architect"
            />
            <Button
              onClick={() => {
                if (!isEmail(email)) return toast.push("Enter a valid email.", "error");
                single.mutate();
              }}
              disabled={single.isPending}
            >
              {single.isPending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        ) : (
          <div className="stack gap-3">
            <Textarea
              label="One per line: email, name, program"
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"asha@example.com, Asha R, AWS Cloud\nvikram@example.com, Vikram S, Data Science"}
            />
            <Button onClick={() => bulk.mutate()} disabled={bulk.isPending}>
              {bulk.isPending ? "Queuing…" : "Send bulk invites"}
            </Button>
          </div>
        )}
      </Card>

      <Card surface="brutalist">
        <div className="row between mb-4 wrap gap-2">
          <h3 style={{ margin: 0 }}>Invitations</h3>
          <Tabs
            tabs={[
              { key: "", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "accepted", label: "Accepted" },
              { key: "expired", label: "Expired" },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </div>

        {invites.isLoading ? (
          <div className="cx-spinner" />
        ) : !invites.data?.length ? (
          <p className="muted">No invitations yet.</p>
        ) : (
          <div className="stack gap-2">
            {invites.data.map((inv) => (
              <div
                key={inv.id}
                className="row between wrap gap-2"
                style={{
                  padding: "10px 12px",
                  border: "2px solid var(--rooman-ink)",
                  background: "var(--surface-raised)",
                }}
              >
                <div className="stack">
                  <strong>{inv.full_name ?? inv.email}</strong>
                  <span className="small muted">
                    {inv.email}
                    {inv.program_trained ? ` · ${inv.program_trained}` : ""}
                  </span>
                </div>
                <div className="row gap-3">
                  <span className="small muted">sent {timeAgo(inv.created_at)}</span>
                  <Badge color={statusColor[inv.status] ?? "var(--rooman-accent)"}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
