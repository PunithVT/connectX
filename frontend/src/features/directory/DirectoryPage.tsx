import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlumniCard } from "@/components/roo/AlumniCard";
import { listProfiles } from "@/api/profile.api";

export function DirectoryPage() {
  const [q, setQ] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => listProfiles(),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return profiles;
    return profiles.filter((p) => {
      const name = p.user?.full_name ?? "";
      return [
        name,
        p.current_company ?? "",
        p.current_title ?? "",
        p.location ?? "",
        p.expertise_domain ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(s);
    });
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
      </div>

      {isLoading ? (
        <div className="mt-20 text-center text-muted-foreground">Loading alumni…</div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <AlumniCard key={p.id} profile={p} />
            ))}
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
