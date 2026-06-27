import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card } from "@/components/ui";
import { listNotifications, markAllRead, markRead } from "@/api/notifications.api";
import { timeAgo } from "@/lib/format";
import type { AppNotification } from "@/types/models";

export function NotificationsPage() {
  const qc = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => listNotifications(false),
  });

  const readOne = useMutation({
    mutationFn: (id: number) => markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const row = (n: AppNotification) => (
    <Card
      key={n.id}
      surface="brutalist"
      style={{
        opacity: n.is_read ? 0.65 : 1,
        borderLeft: n.is_read ? undefined : "6px solid var(--rooman-primary)",
      }}
    >
      <div className="row between wrap gap-2">
        <div className="stack">
          <div className="row gap-2">
            <Badge color="var(--surface-raised)">{n.type}</Badge>
            <span className="small muted">{timeAgo(n.created_at)}</span>
          </div>
          <p style={{ margin: "6px 0 0" }}>{n.message}</p>
          {n.link && (
            <Link to={n.link} className="small" style={{ color: "var(--rooman-blue)" }}>
              View →
            </Link>
          )}
        </div>
        {!n.is_read && (
          <Button variant="ghost" onClick={() => readOne.mutate(n.id)}>
            Mark read
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">Notifications</h1>
        <Button variant="secondary" onClick={() => readAll.mutate()}>
          Mark all read
        </Button>
      </div>

      {notifications.isLoading ? (
        <div className="cx-spinner" />
      ) : !notifications.data?.length ? (
        <p className="muted">You're all caught up.</p>
      ) : (
        <div className="stack gap-3">{notifications.data.map(row)}</div>
      )}
    </div>
  );
}
