import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { bosLoginUrl } from "@/api/auth.api";
import { Button, Card, Input } from "@/components/ui";
import { useBosSsoConfig, useLogin } from "@/features/auth/useAuth";
import { useAuthStore } from "@/store";
import { isEmail } from "@/lib/validators";

// Messages for ?sso_error=<code> set by the backend when a BOS sign-in is refused.
const SSO_ERRORS: Record<string, string> = {
  cancelled: "BOS sign-in was cancelled.",
  no_account:
    "Your BOS account is not linked to connectX yet. Ask Rooman for an invite.",
  account_disabled: "This connectX account has been deactivated.",
  email_unverified: "Verify your email address in BOS, then try again.",
  email_missing: "Your BOS account has no email address.",
  email_unsupported: "Your BOS email address cannot be used for a connectX account.",
};
const SSO_ERROR_FALLBACK =
  "Signing in with BOS did not work. Try again, or use your email and password.";

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const login = useLogin();
  const bosSso = useBosSsoConfig();
  const [searchParams] = useSearchParams();
  const ssoError = searchParams.get("sso_error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/" replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    login.mutate(
      { email, password },
      {
        onSuccess: () => navigate("/"),
        onError: () => setError("Invalid email or password."),
      },
    );
  }

  return (
    <div
      className="row center"
      style={{
        minHeight: "100vh",
        justifyContent: "center",
        padding: "var(--space-4)",
        background: "var(--rooman-paper)",
      }}
    >
      <div style={{ width: "min(420px, 100%)" }}>
        <div className="center mb-4">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 34,
              background: "var(--rooman-ink)",
              color: "var(--rooman-accent)",
              padding: "4px 12px",
            }}
          >
            connectX
          </span>
          <p className="muted mt-2">The Rooman alumni network</p>
        </div>

        <Card surface="brutalist">
          <h2>Welcome back</h2>
          <p className="small muted">Sign in to reconnect with your batch.</p>
          <form className="stack gap-3 mt-4" onSubmit={submit}>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {(error || ssoError) && (
              <span className="small" style={{ color: "#e23b3b" }}>
                {error ?? SSO_ERRORS[ssoError ?? ""] ?? SSO_ERROR_FALLBACK}
              </span>
            )}
            <Button type="submit" block disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          {bosSso.data?.enabled && (
            <div className="stack gap-3 mt-4">
              <p className="small muted center">or</p>
              <Button
                type="button"
                variant="secondary"
                block
                onClick={() => window.location.assign(bosLoginUrl())}
              >
                Sign in with BOS
              </Button>
            </div>
          )}
        </Card>

        <p className="small muted center mt-4">
          Invited by Rooman? Open the link in your email to set up your account.
        </p>
      </div>
    </div>
  );
}
