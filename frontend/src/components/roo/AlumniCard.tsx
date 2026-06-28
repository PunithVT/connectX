import type { AlumniProfile } from "@/types/models";
import { Avatar } from "./Avatar";
import { initials, nameToHue, expertiseTags } from "@/lib/roo-utils";

export function AlumniCard({ profile }: { profile: AlumniProfile }) {
  const name = profile.user?.full_name ?? "Unknown";
  const ini = initials(name);
  const hue = nameToHue(name);
  const tags = expertiseTags(profile.expertise_domain);

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_oklch(0.18_0.02_60_/_0.15)]">
      <div className="flex items-start gap-3">
        <Avatar initials={ini} hue={hue} />
        <div className="min-w-0 flex-1">
          <h3 className="display text-lg leading-tight">{name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {[profile.current_title, profile.current_company].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {profile.bio && (
        <p className="line-clamp-2 text-sm text-foreground/80">{profile.bio}</p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((e) => (
            <span key={e} className="chip">
              {e}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{profile.location ?? ""}</span>
        <button
          disabled
          className="cursor-default text-sm font-medium text-muted-foreground"
          title="Connection requests not yet available"
        >
          Connect →
        </button>
      </div>
    </article>
  );
}
