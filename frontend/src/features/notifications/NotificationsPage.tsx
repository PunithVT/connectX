import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listNotifications, markAllRead, markRead } from "@/api/notifications.api";
import { timeAgo } from "@/lib/roo-utils";
import type { AppNotification } from "@/types/models";

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="chip mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Notifications
          </p>
          <h1 className="display text-4xl text-foreground">Stay in the loop.</h1>
        </div>
        <button
          onClick={() => readAll.mutate()}
          disabled={readAll.isPending || notifications.every((n) => n.is_read)}
          className="mt-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-40"
        >
          {readAll.isPending ? "Marking…" : "Mark all read"}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          You're all caught up.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n: AppNotification) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && readOne.mutate(n.id)}
              className={[
                "rounded-2xl border bg-card p-4 transition-opacity",
                n.is_read
                  ? "border-border opacity-60"
                  : "cursor-pointer border-accent/30 hover:opacity-90",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: message + link */}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{n.message}</p>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-accent hover:underline"
                    >
                      View →
                    </Link>
                  )}
                  {n.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  )}
                </div>
                {/* Right: type chip */}
                <span className="chip shrink-0 text-xs text-muted-foreground">
                  {n.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
