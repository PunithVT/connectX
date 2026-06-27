import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, Input, Modal, Select, Tabs, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  cancelRsvp,
  createEvent,
  listEvents,
  listMyEvents,
  rsvpEvent,
  type CreateEventPayload,
} from "@/api/events.api";
import type { AlumniEvent } from "@/types/models";

const KIND_LABEL: Record<string, string> = {
  webinar: "Webinar",
  meetup: "Meetup",
  ama: "AMA",
  launch: "Launch",
  workshop: "Workshop",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventCard({ event }: { event: AlumniEvent }) {
  const qc = useQueryClient();
  const toast = useToast();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["my-events"] });
  };

  const join = useMutation({
    mutationFn: () => rsvpEvent(event.id),
    onSuccess: (e) => {
      invalidate();
      toast.push(
        e.spots_left === 0 && !e.is_attending
          ? "Added to the waitlist."
          : "You're going!",
        "success",
      );
    },
    onError: () => toast.push("Could not RSVP.", "error"),
  });
  const leave = useMutation({
    mutationFn: () => cancelRsvp(event.id),
    onSuccess: () => {
      invalidate();
      toast.push("RSVP cancelled.", "info");
    },
  });

  const full =
    event.capacity != null && event.spots_left === 0 && !event.is_attending;

  return (
    <Card surface="brutalist">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 34 }}>{event.cover_emoji ?? "📅"}</span>
          <div className="stack">
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 17 }}>
              {event.title}
            </strong>
            <span className="small muted">{formatWhen(event.starts_at)}</span>
          </div>
        </div>
        <Badge color="var(--rooman-blue)" style={{ color: "#fff" }}>
          {KIND_LABEL[event.kind] ?? event.kind}
        </Badge>
      </div>

      {event.description && <p className="small mt-4">{event.description}</p>}

      <div className="row wrap gap-2 mt-4">
        {event.location && (
          <Badge color="var(--surface-raised)">📍 {event.location}</Badge>
        )}
        <Badge color="var(--surface-raised)">
          👥 {event.attendee_count} going
          {event.capacity != null ? ` / ${event.capacity}` : ""}
        </Badge>
        {event.host?.full_name && (
          <Badge color="var(--surface-raised)">Host: {event.host.full_name}</Badge>
        )}
      </div>

      <div className="row between mt-4" style={{ alignItems: "center" }}>
        {event.is_attending && event.meeting_url ? (
          <a
            href={event.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="small"
            style={{ color: "var(--rooman-blue)" }}
          >
            Join link ↗
          </a>
        ) : (
          <span />
        )}
        {event.is_attending ? (
          <Button variant="ghost" onClick={() => leave.mutate()} disabled={leave.isPending}>
            Cancel RSVP
          </Button>
        ) : (
          <Button onClick={() => join.mutate()} disabled={join.isPending}>
            {full ? "Join waitlist" : "RSVP"}
          </Button>
        )}
      </div>
    </Card>
  );
}

const emptyForm: CreateEventPayload = {
  title: "",
  description: "",
  kind: "webinar",
  location: "Online",
  meeting_url: "",
  starts_at: "",
  capacity: null,
  cover_emoji: "📅",
};

export function EventsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [scope, setScope] = useState<"upcoming" | "mine">("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateEventPayload>(emptyForm);

  const events = useQuery({
    queryKey: scope === "mine" ? ["my-events"] : ["events"],
    queryFn: () => (scope === "mine" ? listMyEvents() : listEvents(true)),
  });

  const set = <K extends keyof CreateEventPayload>(
    k: K,
    v: CreateEventPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () =>
      createEvent({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
      setModalOpen(false);
      setForm(emptyForm);
      toast.push("Event published!", "success");
    },
    onError: () => toast.push("Could not create event.", "error"),
  });

  const canSubmit = form.title.trim() && form.starts_at;

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">Events &amp; webinars</h1>
        <Button onClick={() => setModalOpen(true)}>+ Host an event</Button>
      </div>
      <p className="muted">
        Alumni meetups, mentor AMAs and Rooman program launches. RSVP to save your spot.
      </p>

      <Card surface="brutalist">
        <Tabs
          tabs={[
            { key: "upcoming", label: "Upcoming" },
            { key: "mine", label: "My events" },
          ]}
          active={scope}
          onChange={(k) => setScope(k as typeof scope)}
        />
      </Card>

      {events.isLoading ? (
        <div className="cx-spinner" />
      ) : !events.data?.length ? (
        <p className="muted">
          {scope === "mine"
            ? "You haven't RSVP'd to anything yet."
            : "No upcoming events — why not host one?"}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {events.data.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Host an event">
        <div className="stack gap-3">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="DevOps AMA: Scaling on Kubernetes"
          />
          <Textarea
            label="Description"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
          <div className="row gap-3 wrap">
            <Select
              label="Type"
              options={Object.entries(KIND_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
              value={form.kind}
              onChange={(e) => set("kind", e.target.value)}
            />
            <Input
              label="Cover emoji"
              value={form.cover_emoji ?? ""}
              onChange={(e) => set("cover_emoji", e.target.value)}
            />
          </div>
          <Input
            label="Starts at"
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
          />
          <div className="row gap-3 wrap">
            <Input
              label="Location"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Online or a venue"
            />
            <Input
              label="Capacity (optional)"
              type="number"
              value={form.capacity ?? ""}
              onChange={(e) =>
                set("capacity", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <Input
            label="Meeting link (for online events)"
            value={form.meeting_url ?? ""}
            onChange={(e) => set("meeting_url", e.target.value)}
            placeholder="https://…"
          />
          <Button
            block
            onClick={() => canSubmit && create.mutate()}
            disabled={create.isPending || !canSubmit}
          >
            {create.isPending ? "Publishing…" : "Publish event"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
