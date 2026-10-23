import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useBosExchange } from "@/features/auth/useAuth";

// Only in-app paths, never another origin (mirrors the backend's safe_next).
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/";
  }
  return raw;
}

/**
 * Landing page after "Sign in with BOS". The backend redirects here with a
 * one-time code in the URL fragment; we strip it from the address bar at once,
 * trade it for the usual connectX tokens, then continue into the app.
 */
export function BosCompletePage() {
  const navigate = useNavigate();
  const exchange = useBosExchange();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; the code is single-use
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    const code = params.get("code");
    if (!code) {
      navigate("/login?sso_error=invalid_code", { replace: true });
      return;
    }
    exchange.mutate(code, {
      onSuccess: () => navigate(safeNext(params.get("next")), { replace: true }),
      onError: () => navigate("/login?sso_error=invalid_code", { replace: true }),
    });
  }, [exchange, navigate]);

  return (
    <div
      className="row center"
      style={{ minHeight: "100vh", justifyContent: "center" }}
    >
      <p className="muted">Signing you in…</p>
    </div>
  );
}
