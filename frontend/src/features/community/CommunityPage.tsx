import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { joinCommunity, listCommunities } from "@/api/community.api";

export function CommunityPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const communities = useQuery({ queryKey: ["communities"], queryFn: listCommunities });

  const join = useMutation({
    mutationFn: (id: number) => joinCommunity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast.push("Joined the group!", "success");
    },
    onError: () => toast.push("Could not join the group.", "error"),
  });

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Communities</h1>
      <p className="muted">
        Domain and batch groups where alumni help each other. Join the ones that fit you.
      </p>

      {communities.isLoading ? (
        <div className="cx-spinner" />
      ) : !communities.data?.length ? (
        <p className="muted">No communities yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {communities.data.map((c) => (
            <Card key={c.id} surface="brutalist">
              <div className="row between">
                <h3 style={{ margin: 0 }}>{c.name}</h3>
                <Badge color="var(--surface-raised)">{c.member_count} members</Badge>
              </div>
              {c.description && <p className="small mt-2">{c.description}</p>}
              <div className="row gap-2 mt-4">
                <Button
                  onClick={() => join.mutate(c.id)}
                  disabled={join.isPending}
                >
                  Join
                </Button>
                <Link to={`/community/${c.id}`} style={{ flex: 1 }}>
                  <Button variant="secondary" block>
                    Open feed →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
