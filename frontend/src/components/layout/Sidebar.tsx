import { NavLink } from "react-router-dom";

import { useCurrentUser } from "@/features/auth/useAuth";

const links = [
  { to: "/", label: "Feed", icon: "🏠", end: true },
  { to: "/opportunities", label: "Opportunities", icon: "💼" },
  { to: "/mentorship", label: "Mentorship", icon: "🎓" },
  { to: "/startupvarsity", label: "StartupVarsity", icon: "🚀" },
  { to: "/community", label: "Community", icon: "👥" },
  { to: "/profile", label: "My Profile", icon: "🪪" },
];

export function Sidebar() {
  const { data: me } = useCurrentUser();

  return (
    <nav className="stack gap-2">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className="nb-card"
          style={({ isActive }) => ({
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            background: isActive ? "var(--rooman-primary)" : "var(--surface-raised)",
            color: isActive ? "#fff" : "var(--rooman-ink)",
          })}
        >
          <span>{l.icon}</span>
          {l.label}
        </NavLink>
      ))}

      {me?.role === "admin" && (
        <NavLink
          to="/admin/invites"
          className="nb-card"
          style={({ isActive }) => ({
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            background: isActive ? "var(--rooman-blue)" : "var(--surface-raised)",
            color: isActive ? "#fff" : "var(--rooman-ink)",
          })}
        >
          <span>✉️</span>
          Invites (Admin)
        </NavLink>
      )}
    </nav>
  );
}
