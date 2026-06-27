import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Button, Card } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  acceptConnection,
  declineConnection,
  listConnections,
  listPendingRequests,
} from "@/api/connections.api";
import type { ConnectionUser } from "@/types/models";

export function NetworkPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const pending = useQuery({
    queryKey: ["pending-requests"],
    queryFn: listPendingRequests,
  });
  const connections = useQuery({
    queryKey: ["connections"],
    queryFn: listConnections,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pending-requests"] });
    qc.invalidateQueries({ queryKey: ["connections"] });
    qc.invalidateQueries({ queryKey: ["connection-status"] });
  };

  const accept = useMutation({
    mutationFn: (id: number) => acceptConnection(id),
    onSuccess: () => {
      invalidate();
      toast.push("Connected!", "success");
    },
  });
  const decline = useMutation({
    mutationFn: (id: number) => declineConnection(id),
    onSuccess: () => {
      invalidate();
      toast.push("Request dismissed.", "info");
    },
  });

  const personRow = (c: ConnectionUser, actions: React.ReactNode) => (
    <div
      key={c.connection_id}
      className="row between wrap gap-2"
      style={{
        padding: "12px 14px",
        border: "2px solid var(--rooman-ink)",
        background: "var(--surface-raised)",
      }}
    >
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <Avatar name={c.user.full_name} size={42} />
        <div className="stack">
          <Link
            to={`/profile/${c.user.id}`}
            style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}
          >
            {c.user.full_name}
          </Link>
          <span className="small muted">
            {c.headline ?? c.current_company ?? c.expertise_domain ?? "Rooman alumnus"}
          </span>
        </div>
      </div>
      <div className="row gap-2">{actions}</div>
    </div>
  );

  return (
    <div className="stack gap-6">
      <h1 className="page-title">My network</h1>

      <Card surface="brutalist">
        <h3 style={{ marginTop: 0 }}>
          Pending requests{" "}
          {pending.data?.length ? `(${pending.data.length})` : ""}
        </h3>
        {pending.isLoading ? (
          <div className="cx-spinner" />
        ) : !pending.data?.length ? (
          <p className="muted">No pending requests.</p>
        ) : (
          <div className="stack gap-2">
            {pending.data.map((c) =>
              personRow(
                c,
                <>
                  <Button onClick={() => accept.mutate(c.connection_id)}>Accept</Button>
                  <Button variant="ghost" onClick={() => decline.mutate(c.connection_id)}>
                    Dismiss
                  </Button>
                </>,
              ),
            )}
          </div>
        )}
      </Card>

      <Card surface="brutalist">
        <div className="row between">
          <h3 style={{ margin: 0 }}>
            Connections {connections.data?.length ? `(${connections.data.length})` : ""}
          </h3>
          <Link to="/directory" className="small" style={{ color: "var(--rooman-blue)" }}>
            Find more →
          </Link>
        </div>
        {connections.isLoading ? (
          <div className="cx-spinner" />
        ) : !connections.data?.length ? (
          <p className="muted">
            You haven't connected with anyone yet.{" "}
            <Link to="/directory" style={{ color: "var(--rooman-blue)" }}>
              Discover alumni
            </Link>
            .
          </p>
        ) : (
          <div className="stack gap-2">
            {connections.data.map((c) =>
              personRow(
                c,
                <Link to={`/messages/${c.user.id}`}>
                  <Button variant="secondary">Message</Button>
                </Link>,
              ),
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
