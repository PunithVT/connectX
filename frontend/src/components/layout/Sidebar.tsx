import { NavLink } from "react-router-dom";
import { useCurrentUser } from "@/features/auth/useAuth";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "⌂" },
  { to: "/feed", label: "Feed", icon: "✍" },
  { to: "/directory", label: "Directory", icon: "⌕" },
  { to: "/network", label: "My Network", icon: "⇄" },
  { to: "/messages", label: "Messages", icon: "✉" },
  { to: "/opportunities", label: "Opportunities", icon: "▦" },
  { to: "/mentorship", label: "Mentorship", icon: "◈" },
  { to: "/events", label: "Events", icon: "▤" },
  { to: "/startupvarsity", label: "Startup Hub", icon: "▲" },
  { to: "/community", label: "Community", icon: "◉" },
  { to: "/spotlight", label: "Spotlight", icon: "★" },
  { to: "/profile", label: "My Profile", icon: "◐" },
];

export function Sidebar() {
  const { data: me } = useCurrentUser();

  return (
    <nav className="space-y-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`
          }
        >
          <span className="display text-base">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}

      {me?.role === "admin" && (
        <NavLink
          to="/admin/invites"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`
          }
        >
          <span className="display text-base">✉</span>
          Invites (Admin)
        </NavLink>
      )}
    </nav>
  );
}
