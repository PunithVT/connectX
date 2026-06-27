import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Button, Card, Input } from "@/components/ui";
import { useLogin } from "@/features/auth/useAuth";
import { useAuthStore } from "@/store";
import { isEmail } from "@/lib/validators";

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const login = useLogin();

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
            {error && (
              <span className="small" style={{ color: "#e23b3b" }}>
                {error}
              </span>
            )}
            <Button type="submit" block disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="small muted center mt-4">
          Invited by Rooman? Open the link in your email to set up your account.
        </p>
      </div>
    </div>
  );
}
