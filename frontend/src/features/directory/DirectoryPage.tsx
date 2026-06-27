import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Avatar, Badge, Card, Input, Select } from "@/components/ui";
import { ConnectButton } from "@/features/network/ConnectButton";
import { listProfiles } from "@/api/profile.api";
import { EXPERTISE_DOMAINS } from "@/lib/validators";

const domainOptions = [
  { value: "", label: "All domains" },
  ...EXPERTISE_DOMAINS.map((d) => ({ value: d, label: d })),
];

export function DirectoryPage() {
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");

  const profiles = useQuery({
    queryKey: ["directory", domain],
    queryFn: () => listProfiles(domain || undefined),
  });

  const q = search.trim().toLowerCase();
  const filtered = (profiles.data ?? []).filter((p) => {
    if (!q) return true;
    return [
      p.user?.full_name,
      p.headline,
      p.current_title,
      p.current_company,
      p.expertise_domain,
      p.skills,
      p.location,
    ]
      .filter(Boolean)
      .some((f) => f!.toLowerCase().includes(q));
  });

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Discover alumni</h1>
      <p className="muted">
        Find fellow Rooman graduates by expertise, connect, and start a conversation.
      </p>

      <Card surface="brutalist">
        <div className="row wrap gap-3" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input
              label="Search by name, company, skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Asha, AWS, Infosys"
            />
          </div>
          <div style={{ minWidth: 220 }}>
            <Select
              label="Filter by expertise"
              options={domainOptions}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {profiles.isLoading ? (
        <div className="cx-spinner" />
      ) : !filtered.length ? (
        <p className="muted">No alumni found for this filter.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {filtered.map((p) => (
            <Card key={p.id} surface="brutalist">
              <div className="row gap-3" style={{ alignItems: "center" }}>
                <Avatar name={p.user?.full_name} url={p.avatar_url} size={48} />
                <div className="stack" style={{ minWidth: 0 }}>
                  <Link
                    to={`/profile/${p.user_id}`}
                    style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}
                  >
                    {p.user?.full_name ?? "Alumnus"}
                  </Link>
                  <span className="small muted">
                    {p.headline ?? p.current_title ?? "Rooman graduate"}
                  </span>
                </div>
              </div>

              <div className="row wrap gap-2 mt-4">
                {p.expertise_domain && <Badge>{p.expertise_domain}</Badge>}
                {p.current_company && (
                  <Badge color="var(--surface-raised)">🏢 {p.current_company}</Badge>
                )}
              </div>

              <div className="row wrap gap-2 mt-2">
                {p.open_to_mentoring && (
                  <span className="small" style={{ color: "var(--rooman-green)" }}>
                    • mentors
                  </span>
                )}
                {p.open_to_opportunities && (
                  <span className="small" style={{ color: "var(--rooman-primary)" }}>
                    • open to roles
                  </span>
                )}
              </div>

              <div className="row between mt-4">
                <Link to={`/profile/${p.user_id}`} className="small muted">
                  View profile →
                </Link>
                <ConnectButton userId={p.user_id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
