import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/roo/Avatar";
import { useCurrentUser, useLogout } from "@/features/auth/useAuth";
import { listNotifications } from "@/api/notifications.api";
import { initials, nameToHue } from "@/lib/roo-utils";

export function Navbar() {
  const { data: me } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => listNotifications(true),
    refetchInterval: 60_000,
  });
  const unread = notifications?.length ?? 0;
  const name = me?.full_name ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="display text-xl font-semibold tracking-tight">connectX</span>
          <span className="chip hidden sm:inline-flex">Rooman Alumni</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                {unread}
              </span>
            )}
          </Link>

          <Link to="/profile" className="shrink-0">
            <Avatar initials={initials(name)} hue={nameToHue(name)} size={34} />
          </Link>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
