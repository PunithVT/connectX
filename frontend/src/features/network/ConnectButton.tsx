import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  acceptConnection,
  getConnectionStatus,
  requestConnection,
} from "@/api/connections.api";

export function ConnectButton({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const status = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: () => getConnectionStatus(userId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["connection-status", userId] });
    qc.invalidateQueries({ queryKey: ["connections"] });
    qc.invalidateQueries({ queryKey: ["pending-requests"] });
  };

  const request = useMutation({
    mutationFn: () => requestConnection(userId),
    onSuccess: () => {
      invalidate();
      toast.push("Connection request sent.", "success");
    },
    onError: () => toast.push("Could not send request.", "error"),
  });

  const accept = useMutation({
    mutationFn: () => acceptConnection(status.data!.connection_id!),
    onSuccess: () => {
      invalidate();
      toast.push("You're now connected!", "success");
    },
  });

  if (status.isLoading || !status.data) return null;

  switch (status.data.state) {
    case "self":
      return null;
    case "connected":
      return (
        <Button variant="secondary" onClick={() => navigate(`/messages/${userId}`)}>
          Message
        </Button>
      );
    case "pending_outgoing":
      return (
        <Button variant="ghost" disabled>
          Requested
        </Button>
      );
    case "pending_incoming":
      return (
        <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
          Accept request
        </Button>
      );
    default:
      return (
        <Button onClick={() => request.mutate()} disabled={request.isPending}>
          Connect
        </Button>
      );
  }
}
