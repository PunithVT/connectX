import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/roo/Avatar";
import { fetchMyProfile, fetchProfile } from "@/api/profile.api";
import { initials, nameToHue, expertiseTags } from "@/lib/roo-utils";

export function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const isOwn = !userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: isOwn ? ["profile", "me"] : ["profile", Number(userId)],
    queryFn: isOwn ? fetchMyProfile : () => fetchProfile(Number(userId!)),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Profile not found.
      </div>
    );
  }

  const name = profile.user?.full_name ?? "Unknown";
  const ini = initials(name);
  const hue = nameToHue(name);
  const tags = expertiseTags(profile.expertise_domain);
  const skillList = expertiseTags(profile.skills ?? "");

  const sidebarRows = [
    profile.location && { l: "Location", v: profile.location },
    profile.current_company && { l: "Company", v: profile.current_company },
    profile.current_title && { l: "Designation", v: profile.current_title },
    profile.program_trained && { l: "Program", v: profile.program_trained },
    profile.batch_year && { l: "Batch Year", v: String(profile.batch_year) },
  ].filter(Boolean) as { l: string; v: string }[];

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {/* Cover */}
      <div className="grain relative h-40 overflow-hidden rounded-3xl bg-gradient-to-br from-accent/80 via-accent to-foreground" />

      <div className="-mt-16 px-2 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <div className="rounded-full bg-background p-1.5">
              <Avatar initials={ini} hue={hue} size={112} />
            </div>
            <div className="pb-2">
              <h1 className="display text-4xl">{name}</h1>
              <p className="text-muted-foreground">
                {[profile.current_title, profile.current_company]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          {isOwn && (
            <Link
              to="/profile/edit"
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Edit profile
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {profile.bio && (
              <section>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  About
                </div>
                <p className="mt-3 text-[15px] leading-relaxed">{profile.bio}</p>
              </section>
            )}
            {skillList.length > 0 && (
              <section>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Skills
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skillList.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {tags.length > 0 && (
              <section>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Expertise
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((s) => (
                    <span key={s} className="chip border-accent/40 text-accent">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {sidebarRows.map((row) => (
              <div key={row.l} className="rounded-2xl border border-border bg-card p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {row.l}
                </div>
                <div className="mt-1 font-medium">{row.v}</div>
              </div>
            ))}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-border bg-card p-4 hover:border-accent/40"
              >
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  LinkedIn
                </div>
                <div className="mt-1 truncate text-sm text-accent">
                  {profile.linkedin_url}
                </div>
              </a>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
