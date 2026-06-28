import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MentorCard } from "@/components/roo/MentorCard";
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

  const openBooking = (mentorId: number) => {
    const mentor = mentors.data?.find((m) => m.id === mentorId);
    if (mentor) setActive(mentor);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Mentorship
          </div>
          <h1 className="mt-2 display text-4xl leading-tight md:text-5xl">
            Learn from alumni who've{" "}
            <span className="italic text-accent">already</span> done it.
          </h1>
        </div>
        <div className="md:pt-4">
          <p className="text-muted-foreground">
            Book 1:1 sessions with senior Rooman alumni working at top product companies.
            All mentors are vetted by the community — and pricing stays transparent.
          </p>
          <Link
            to="/mentorship/become"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Become a mentor →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <strong className="text-foreground">Get paid to share what you know.</strong>
        <p className="mt-1 text-sm text-muted-foreground">
          Rooman alumni run mentorship sessions on Rooman programs at industry-standard
          rates. Book a mentor below, or list yourself as one.
        </p>
      </div>

      <div className="mt-4">
        <Tabs
          tabs={[
            { key: "mentors", label: "Find a mentor" },
            { key: "sessions", label: "My sessions" },
            { key: "leaderboard", label: "Top mentors" },
          ]}
          active={tab}
          onChange={(k) => setTab(k as "mentors" | "sessions" | "leaderboard")}
        />
      </div>

      {tab === "mentors" &&
        (mentors.isLoading ? (
          <div className="mt-20 text-center text-muted-foreground">Loading mentors…</div>
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mentors.data?.map((m) => (
              <MentorCard key={m.id} mentor={m} onBook={openBooking} />
            ))}
            {!mentors.data?.length && (
              <p className="col-span-3 text-center text-muted-foreground">
                No mentors listed yet.{" "}
                <Link to="/mentorship/become" className="text-accent underline">
                  Be the first →
                </Link>
              </p>
            )}
          </div>
        ))}

      {tab === "sessions" &&
        (sessions.isLoading ? (
          <div className="mt-20 text-center text-muted-foreground">Loading sessions…</div>
        ) : !sessions.data?.length ? (
          <p className="mt-12 text-center text-muted-foreground">You have no sessions yet.</p>
        ) : (
          <div className="mt-12 grid gap-4">
            {sessions.data.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="display text-lg leading-tight">
                      {s.program ?? "Mentorship session"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                  <div className="mt-4 flex justify-end">
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
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    {s.reviewed ? (
                      <span className="text-sm text-muted-foreground">
                        You reviewed this session. ✓
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">How did it go?</span>
                    )}
                    {!s.reviewed && (
                      <Button onClick={() => setReviewing(s)}>Leave a review</Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

      {tab === "leaderboard" &&
        (leaderboard.isLoading ? (
          <div className="mt-20 text-center text-muted-foreground">Loading leaderboard…</div>
        ) : !leaderboard.data?.length ? (
          <p className="mt-12 text-center text-muted-foreground">
            No ranked mentors yet — reviews will populate this board.
          </p>
        ) : (
          <div className="mt-12 grid gap-4">
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
                      {`#${i + 1}`}
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
    </section>
  );
}
