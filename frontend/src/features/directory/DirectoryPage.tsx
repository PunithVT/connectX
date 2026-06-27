import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "@/components/roo/Avatar";
import { ConnectButton } from "@/features/network/ConnectButton";
import { listProfiles } from "@/api/profile.api";
import { EXPERTISE_DOMAINS } from "@/lib/validators";
import { initials, nameToHue, expertiseTags } from "@/lib/roo-utils";

export function DirectoryPage() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles", domain],
    queryFn: () => listProfiles(domain || undefined),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return profiles;
    return profiles.filter((p) =>
      [
        p.user?.full_name,
        p.headline,
        p.current_title,
        p.current_company,
        p.expertise_domain,
        p.skills,
        p.location,
      ]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(s)),
    );
  }, [q, profiles]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Directory
          </div>
          <h1 className="mt-2 display text-4xl md:text-5xl">
            {isLoading ? "Loading…" : `${filtered.length} alumni, one search away`}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-96">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, company, skill…"
              className="w-full rounded-full border border-border bg-card px-5 py-3 pr-12 text-sm outline-none focus:border-accent"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              ⌕
            </span>
          </div>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:border-accent md:w-56"
          >
            <option value="">All domains</option>
            {EXPERTISE_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-20 text-center text-muted-foreground">Loading alumni…</div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const name = p.user?.full_name ?? "Alumnus";
              const tags = expertiseTags(p.expertise_domain);
              return (
                <article
                  key={p.id}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_oklch(0.18_0.02_60_/_0.15)]"
                >
                  <div className="flex items-start gap-3">
                    <Avatar initials={initials(name)} hue={nameToHue(name)} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${p.user_id}`}
                        className="display text-lg leading-tight hover:text-accent"
                      >
                        {name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {p.headline ??
                          [p.current_title, p.current_company]
                            .filter(Boolean)
                            .join(" · ") ??
                          "Rooman graduate"}
                      </p>
                    </div>
                  </div>

                  {p.bio && (
                    <p className="line-clamp-2 text-sm text-foreground/80">{p.bio}</p>
                  )}

                  {(tags.length > 0 || p.current_company) && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 3).map((e) => (
                        <span key={e} className="chip">
                          {e}
                        </span>
                      ))}
                      {p.current_company && (
                        <span className="chip">🏢 {p.current_company}</span>
                      )}
                    </div>
                  )}

                  {(p.open_to_mentoring || p.open_to_opportunities) && (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {p.open_to_mentoring && <span>• mentors</span>}
                      {p.open_to_opportunities && <span>• open to roles</span>}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <Link
                      to={`/profile/${p.user_id}`}
                      className="text-sm font-medium text-muted-foreground hover:text-accent"
                    >
                      View profile →
                    </Link>
                    <ConnectButton userId={p.user_id} />
                  </div>
                </article>
              );
            })}
          </div>
          {filtered.length === 0 && q && (
            <div className="mt-20 text-center text-muted-foreground">
              No alumni match "{q}".
            </div>
          )}
          {filtered.length === 0 && !q && (
            <div className="mt-20 text-center text-muted-foreground">
              No alumni profiles yet.
            </div>
          )}
        </>
      )}
    </section>
  );
}
