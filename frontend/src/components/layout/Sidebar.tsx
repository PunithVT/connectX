import { NavLink } from "react-router-dom";

import { useCurrentUser } from "@/features/auth/useAuth";

const links = [
  { to: "/", label: "Feed", end: true },
  { to: "/directory", label: "Discover" },
  { to: "/network", label: "My Network" },
  { to: "/messages", label: "Messages" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/mentorship", label: "Mentorship" },
  { to: "/events", label: "Events" },
  { to: "/startupvarsity", label: "StartupVarsity" },
  { to: "/community", label: "Community" },
  { to: "/spotlight", label: "Spotlight" },
  { to: "/profile", label: "My Profile" },
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
          Invites (Admin)
        </NavLink>
      )}
    </nav>
  );
}
