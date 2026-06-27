import { Avatar, Badge } from "@/components/ui";
import type { AlumniProfile } from "@/types/models";

export function ProfileCard({ profile }: { profile: AlumniProfile }) {
  const name = profile.user?.full_name ?? "Rooman Alumnus";
  return (
    <div className="skeu-idcard" style={{ padding: "var(--space-6)" }}>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <Avatar name={name} url={profile.avatar_url} size={72} />
          <div className="stack">
            <strong style={{ fontSize: 20, fontFamily: "var(--font-display)" }}>{name}</strong>
            <span className="small muted">{profile.headline ?? profile.current_title ?? "Rooman graduate"}</span>
            {profile.current_company && (
              <span className="small">@ {profile.current_company}</span>
            )}
          </div>
        </div>
        <div
          className="center small"
          style={{
            fontFamily: "var(--font-display)",
            border: "2px dashed var(--rooman-ink)",
            padding: "4px 8px",
          }}
        >
          ROOMAN
          <br />
          ALUMNI
        </div>
      </div>

      <div className="row wrap gap-2 mt-4">
        {profile.expertise_domain && <Badge>{profile.expertise_domain}</Badge>}
        {profile.location && (
          <Badge color="var(--surface-raised)">📍 {profile.location}</Badge>
        )}
        {profile.program_trained && (
          <Badge color="var(--rooman-blue)" style={{ color: "#fff" }}>
            🎓 {profile.program_trained}
            {profile.batch_year ? ` ’${String(profile.batch_year).slice(-2)}` : ""}
          </Badge>
        )}
      </div>

      {profile.bio && <p className="mt-4">{profile.bio}</p>}

      {profile.skills && (
        <div className="mt-4">
          <span className="small muted">Skills</span>
          <div className="row wrap gap-2 mt-2">
            {profile.skills.split(",").map((s) => (
              <span key={s} className="nb-badge" style={{ background: "var(--surface-raised)" }}>
                {s.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="row wrap gap-2 mt-4">
        {profile.open_to_mentoring && (
          <Badge color="var(--rooman-green)" style={{ color: "#fff" }}>Open to mentoring</Badge>
        )}
        {profile.open_to_opportunities && (
          <Badge color="var(--rooman-primary)" style={{ color: "#fff" }}>Open to opportunities</Badge>
        )}
        {profile.interested_in_startupvarsity && (
          <Badge color="var(--rooman-ink)" style={{ color: "var(--rooman-accent)" }}>
            StartupVarsity
          </Badge>
        )}
      </div>

      {profile.linkedin_url && (
        <a
          href={profile.linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="small mt-4"
          style={{ display: "inline-block", color: "var(--rooman-blue)" }}
        >
          View LinkedIn ↗
        </a>
      )}
    </div>
  );
}
