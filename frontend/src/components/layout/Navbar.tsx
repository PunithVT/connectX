import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "@/components/ui";
import { useCurrentUser, useLogout } from "@/features/auth/useAuth";
import { listNotifications } from "@/api/notifications.api";
import { listConversations } from "@/api/messages.api";

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

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: 60_000,
  });
  const unreadMessages =
    conversations?.reduce((sum, c) => sum + (c.unread ?? 0), 0) ?? 0;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--rooman-accent)",
        borderBottom: "3px solid var(--rooman-ink)",
      }}
    >
      <div className="container row between" style={{ height: 64 }}>
        <Link to="/" className="row gap-2" style={{ alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              background: "var(--rooman-ink)",
              color: "var(--rooman-accent)",
              padding: "2px 8px",
            }}
          >
            connectX
          </span>
          <span className="small muted">Rooman Alumni</span>
        </Link>

        <div className="row gap-3">
          <Link to="/messages" className="nb-badge" style={{ position: "relative" }}>
            Messages
            {unreadMessages > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "var(--rooman-primary)",
                  color: "#fff",
                  borderRadius: "50%",
                  border: "2px solid var(--rooman-ink)",
                  minWidth: 20,
                  height: 20,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unreadMessages}
              </span>
            )}
          </Link>
          <Link to="/notifications" className="nb-badge" style={{ position: "relative" }}>
            Alerts
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "var(--rooman-primary)",
                  color: "#fff",
                  borderRadius: "50%",
                  border: "2px solid var(--rooman-ink)",
                  minWidth: 20,
                  height: 20,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unread}
              </span>
            )}
          </Link>
          <Link to="/profile" className="row gap-2" style={{ alignItems: "center" }}>
            <Avatar name={me?.full_name} size={36} />
          </Link>
          <button
            className="nb-btn"
            style={{ background: "transparent", boxShadow: "none", padding: "4px 10px" }}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
