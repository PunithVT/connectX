import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Input, Modal, Select, Tabs } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { bookSession, listMentors, listMySessions } from "@/api/mentorship.api";
import { rupees } from "@/lib/format";
import type { MentorProfile } from "@/types/models";

export function MentorshipHubPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"mentors" | "sessions">("mentors");
  const [active, setActive] = useState<MentorProfile | null>(null);
  const [program, setProgram] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);

  const mentors = useQuery({ queryKey: ["mentors"], queryFn: listMentors });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: listMySessions,
    enabled: tab === "sessions",
  });

  const book = useMutation({
    mutationFn: () =>
      bookSession({
        mentor_id: active!.id,
        program: program || undefined,
        scheduled_at: new Date(when).toISOString(),
        duration_minutes: duration,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setActive(null);
      toast.push("Session requested! The mentor will confirm.", "success");
    },
    onError: () => toast.push("Could not book the session.", "error"),
  });

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">Mentorship</h1>
        <Link to="/mentorship/become">
          <Button variant="secondary">Become a mentor</Button>
        </Link>
      </div>

      <Card surface="neu">
        <strong>💡 Get paid to share what you know.</strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Rooman alumni run mentorship sessions on Rooman programs at industry-standard
          rates. Book a mentor below, or list yourself as one.
        </p>
      </Card>

      <Tabs
        tabs={[
          { key: "mentors", label: "Find a mentor" },
          { key: "sessions", label: "My sessions" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "mentors" | "sessions")}
      />

      {tab === "mentors" ? (
        mentors.isLoading ? (
          <div className="cx-spinner" />
        ) : !mentors.data?.length ? (
          <p className="muted">No mentors are listed yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {mentors.data.map((m) => (
              <Card key={m.id} surface="brutalist">
                <div className="row gap-3" style={{ alignItems: "center" }}>
                  <Avatar name={m.user?.full_name} size={48} />
                  <div className="stack">
                    <strong>{m.user?.full_name ?? "Mentor"}</strong>
                    <span className="small muted">{m.headline ?? "Rooman mentor"}</span>
                  </div>
                </div>
                {m.programs && (
                  <div className="row wrap gap-2 mt-4">
                    {m.programs.split(",").map((p) => (
                      <Badge key={p} color="var(--surface-raised)">
                        {p.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                {m.bio && <p className="small mt-2">{m.bio}</p>}
                <div className="row between mt-4">
                  <strong>{rupees(m.hourly_rate)}/hr</strong>
                  <Button onClick={() => setActive(m)}>Book</Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : sessions.isLoading ? (
        <div className="cx-spinner" />
      ) : !sessions.data?.length ? (
        <p className="muted">You have no sessions yet.</p>
      ) : (
        <div className="stack gap-3">
          {sessions.data.map((s) => (
            <Card key={s.id} surface="brutalist">
              <div className="row between wrap gap-2">
                <div className="stack">
                  <strong>{s.program ?? "Mentorship session"}</strong>
                  <span className="small muted">
                    {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min
                  </span>
                </div>
                <div className="row gap-2">
                  <Badge color="var(--rooman-blue)" style={{ color: "#fff" }}>
                    {s.status}
                  </Badge>
                  <Badge
                    color={s.payment_status === "paid" ? "var(--rooman-green)" : "var(--rooman-accent)"}
                    style={{ color: s.payment_status === "paid" ? "#fff" : "var(--rooman-ink)" }}
                  >
                    {rupees(s.amount)} · {s.payment_status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={`Book ${active?.user?.full_name ?? "mentor"}`}
      >
        <div className="stack gap-3">
          <p className="small muted">
            {rupees(active?.hourly_rate ?? 0)}/hr · billed for the session duration.
          </p>
          <Input
            label="Program / topic"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g. AWS Solutions Architect prep"
          />
          <Input
            label="Date & time"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <Select
            label="Duration"
            options={[
              { value: "30", label: "30 minutes" },
              { value: "60", label: "60 minutes" },
              { value: "90", label: "90 minutes" },
            ]}
            value={String(duration)}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Button
            block
            onClick={() => when && book.mutate()}
            disabled={book.isPending || !when}
          >
            {book.isPending ? "Booking…" : "Request session"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
