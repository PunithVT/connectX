import type { MentorProfile } from "@/types/models";
import { Avatar } from "./Avatar";
import { initials, nameToHue } from "@/lib/roo-utils";

export function MentorCard({
  mentor,
  onBook,
}: {
  mentor: MentorProfile;
  onBook?: (mentorId: number) => void;
}) {
  const name = mentor.user?.full_name ?? "Unknown";
  const ini = initials(name);
  const hue = nameToHue(name);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar initials={ini} hue={hue} />
          <div>
            <h3 className="display text-lg leading-tight">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {mentor.headline ?? mentor.programs ?? ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="display text-xl">₹{mentor.hourly_rate.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">per session</div>
        </div>
      </div>
      {mentor.bio && (
        <p className="line-clamp-2 text-sm text-foreground/80">{mentor.bio}</p>
      )}
      <div className="flex items-center justify-end border-t border-border pt-3">
        <button
          onClick={() => onBook?.(mentor.id)}
          className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
        >
          Request mentorship
        </button>
      </div>
    </article>
  );
}
