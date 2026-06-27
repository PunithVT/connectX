import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Badge, Button, Card, Input, Modal, Select, Tabs, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  bookSession,
  completeSession,
  getLeaderboard,
  listMentors,
  listMySessions,
  reviewSession,
} from "@/api/mentorship.api";
import { rupees } from "@/lib/format";
import type { MentorProfile, MentorshipSession } from "@/types/models";

function Stars({ value }: { value: number }) {
  return (
    <span style={{ color: "var(--rooman-accent)", letterSpacing: 1 }}>
      {"★".repeat(Math.round(value))}
      <span className="muted">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function MentorshipHubPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"mentors" | "sessions" | "leaderboard">("mentors");
  const [active, setActive] = useState<MentorProfile | null>(null);
  const [program, setProgram] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);

  // Post-session review modal
  const [reviewing, setReviewing] = useState<MentorshipSession | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mentors = useQuery({ queryKey: ["mentors"], queryFn: listMentors });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: listMySessions,
    enabled: tab === "sessions",
  });
  const leaderboard = useQuery({
    queryKey: ["mentor-leaderboard"],
    queryFn: getLeaderboard,
    enabled: tab === "leaderboard",
  });

  const complete = useMutation({
    mutationFn: (id: number) => completeSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.push("Session marked complete. You can leave a review now.", "success");
    },
    onError: () => toast.push("Could not update the session.", "error"),
  });

  const review = useMutation({
    mutationFn: () =>
      reviewSession({
        session_id: reviewing!.id,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["mentor-leaderboard"] });
      setReviewing(null);
      setRating(5);
      setComment("");
      toast.push("Thanks for the review!", "success");
    },
    onError: () => toast.push("Could not submit the review.", "error"),
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
          { key: "leaderboard", label: "Top mentors" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "mentors" | "sessions" | "leaderboard")}
      />

      {tab === "mentors" &&
        (mentors.isLoading ? (
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
        ))}

      {tab === "sessions" &&
        (sessions.isLoading ? (
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
                {s.status !== "completed" && s.status !== "cancelled" && (
                  <div className="row mt-4" style={{ justifyContent: "flex-end" }}>
                    <Button
                      variant="secondary"
                      onClick={() => complete.mutate(s.id)}
                      disabled={complete.isPending}
                    >
                      Mark complete
                    </Button>
                  </div>
                )}
                {s.status === "completed" && (
                  <div className="row between mt-4" style={{ alignItems: "center" }}>
                    {s.reviewed ? (
                      <span className="small muted">You reviewed this session. ✓</span>
                    ) : (
                      <span className="small muted">How did it go?</span>
                    )}
                    {!s.reviewed && (
                      <Button onClick={() => setReviewing(s)}>Leave a review</Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}

      {tab === "leaderboard" &&
        (leaderboard.isLoading ? (
          <div className="cx-spinner" />
        ) : !leaderboard.data?.length ? (
          <p className="muted">No ranked mentors yet — reviews will populate this board.</p>
        ) : (
          <div className="stack gap-3">
            {leaderboard.data.map((e, i) => (
              <Card key={e.mentor_id} surface={i === 0 ? "neu" : "brutalist"}>
                <div className="row between wrap gap-3" style={{ alignItems: "center" }}>
                  <div className="row gap-3" style={{ alignItems: "center" }}>
                    <strong
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        minWidth: 32,
                        textAlign: "center",
                      }}
                    >
                      {i === 0 ? "🏆" : `#${i + 1}`}
                    </strong>
                    <Avatar name={e.user?.full_name} size={44} />
                    <div className="stack">
                      <strong>{e.user?.full_name ?? "Mentor"}</strong>
                      <span className="small muted">{e.headline ?? "Rooman mentor"}</span>
                    </div>
                  </div>
                  <div className="stack" style={{ alignItems: "flex-end" }}>
                    <Stars value={e.avg_rating} />
                    <span className="small muted">
                      {e.avg_rating.toFixed(1)} · {e.review_count} reviews ·{" "}
                      {e.sessions_completed} sessions
                    </span>
                    <span className="small">{rupees(e.hourly_rate)}/hr</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

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

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Rate your session"
      >
        <div className="stack gap-3">
          <p className="small muted">
            {reviewing?.program ?? "Mentorship session"} ·{" "}
            {reviewing && new Date(reviewing.scheduled_at).toLocaleDateString()}
          </p>
          <div className="stack gap-1">
            <span className="small muted">Your rating</span>
            <div className="row gap-1" style={{ fontSize: 28, cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  role="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  style={{
                    color:
                      n <= rating ? "var(--rooman-accent)" : "var(--surface-raised)",
                    lineHeight: 1,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <Textarea
            label="Comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What was helpful? What could be better?"
          />
          <Button
            block
            onClick={() => review.mutate()}
            disabled={review.isPending}
          >
            {review.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
