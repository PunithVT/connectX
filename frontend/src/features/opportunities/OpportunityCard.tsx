import { Avatar, Badge, Card } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { Opportunity } from "@/types/models";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const hiring = opp.kind === "hiring";
  return (
    <Card surface="brutalist">
      <div className="row between wrap gap-2">
        <Badge
          color={hiring ? "var(--rooman-primary)" : "var(--rooman-green)"}
          style={{ color: "#fff" }}
        >
          {hiring ? "Hiring" : "Seeking"}
        </Badge>
        <span className="small muted">{timeAgo(opp.created_at)}</span>
      </div>

      <h3 style={{ margin: "10px 0 4px" }}>{opp.title}</h3>
      <div className="row wrap gap-2 small muted">
        {opp.company && <span>🏢 {opp.company}</span>}
        {opp.expertise_domain && <span>🧭 {opp.expertise_domain}</span>}
        {opp.location && <span>📍 {opp.location}</span>}
      </div>

      {opp.description && <p style={{ marginTop: 10 }}>{opp.description}</p>}

      <div className="row gap-2 mt-4" style={{ alignItems: "center" }}>
        <Avatar name={opp.author?.full_name} size={28} />
        <span className="small">{opp.author?.full_name ?? "Alumnus"}</span>
        {opp.status !== "open" && (
          <Badge color="#bdb8ad" style={{ marginLeft: "auto" }}>
            {opp.status}
          </Badge>
        )}
      </div>
    </Card>
  );
}
