import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useLogin } from "@/features/auth/useAuth";
import { useAuthStore } from "@/store";
import { isEmail } from "@/lib/validators";

const WORDS = ["network.", "community.", "batch.", "circle."];

const BLOBS = [
  { size: 520, top: "-10%", left: "-15%", delay: "0s",    dur: "18s" },
  { size: 420, top: "50%",  left: "55%",  delay: "-6s",   dur: "22s" },
  { size: 340, top: "25%",  left: "30%",  delay: "-11s",  dur: "16s" },
];

const ORBIT_RINGS = [
  { r: 140, dur: "28s", items: ["AI", "Dev", "Design", "PM"] },
  { r: 210, dur: "42s", items: ["Finance", "Sales", "Legal", "HR", "Ops"] },
  { r: 280, dur: "60s", reverse: true, items: ["SaaS", "Fintech", "EdTech", "HealthTech"] },
];

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [wordIdx, setWordIdx]   = useState(0);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 350);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  if (token) return <Navigate to="/dashboard" replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email))  return setError("Enter a valid email address.");
    if (!password)        return setError("Enter your password.");
    login.mutate(
      { email, password },
      {
        onSuccess: () => navigate("/dashboard"),
        onError:   () => setError("Invalid email or password."),
      },
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-14 text-background">
        {/* Blobs */}
        {BLOBS.map((b, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-full opacity-[0.12]"
            style={{
              width:  b.size,
              height: b.size,
              top:    b.top,
              left:   b.left,
              background: "radial-gradient(circle, oklch(0.62 0.19 38), oklch(0.55 0.10 155))",
              animation: `blob ${b.dur} ${b.delay} ease-in-out infinite`,
            }}
          />
        ))}

        {/* Orbit rings */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {ORBIT_RINGS.map((ring, ri) => (
            <div
              key={ri}
              className="absolute rounded-full border border-background/10"
              style={{
                width:  ring.r * 2,
                height: ring.r * 2,
                animation: `${ring.reverse ? "orbit-spin-centered" : "orbit-spin-centered"} ${ring.dur} linear infinite ${ring.reverse ? "reverse" : ""}`,
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }}
            >
              {ring.items.map((label, ii) => {
                const angle = (ii / ring.items.length) * 360;
                const rad   = (angle * Math.PI) / 180;
                const x     = ring.r + ring.r * Math.cos(rad) - 32;
                const y     = ring.r + ring.r * Math.sin(rad) - 12;
                return (
                  <span
                    key={label}
                    className="absolute rounded-full border border-background/20 bg-background/10 px-2.5 py-0.5 text-[11px] text-background/70 backdrop-blur-sm"
                    style={{
                      left: x,
                      top:  y,
                      animation: `orbit-spin-centered ${ring.dur} linear infinite ${ring.reverse ? "" : "reverse"}`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="display text-2xl font-semibold text-background/90">
            connectX
          </Link>
        </div>

        {/* CTA copy */}
        <div className="relative z-10 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-background/50">
            Rooman Alumni Network
          </p>
          <h1 className="display text-5xl leading-tight text-background">
            Your alumni
            <br />
            <span
              className="text-accent transition-opacity duration-300"
              style={{ opacity: visible ? 1 : 0 }}
            >
              {WORDS[wordIdx]}
            </span>
          </h1>
          <p className="max-w-xs text-[15px] leading-relaxed text-background/60">
            Connect with peers, discover opportunities, and build the next big thing —
            all inside one trusted circle.
          </p>

          {/* Testimonial */}
          <div className="rounded-2xl border border-background/10 bg-background/5 p-5 backdrop-blur-sm">
            <p className="text-sm italic leading-relaxed text-background/70">
              "connectX helped me find my co-founder within 2 weeks of joining. The
              alumni network here is unlike anything I've seen."
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-medium"
                style={{ background: "oklch(0.62 0.19 38 / 0.25)", color: "oklch(0.95 0.05 85)" }}
              >
                AK
              </div>
              <div>
                <div className="text-xs font-medium text-background/80">Arjun Khatri</div>
                <div className="text-[11px] text-background/40">Batch of 2019 · Founder, Zenit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-background/30">
            © Rooman · Connect · 2026
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div
          className="w-full max-w-sm space-y-8"
          style={{ animation: "pop-in 0.45s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Link to="/" className="display text-2xl font-semibold">connectX</Link>
            <p className="mt-1 text-sm text-muted-foreground">Rooman Alumni Network</p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="display text-3xl">Welcome back.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to reconnect with your batch.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div
              className="space-y-1"
              style={{ animation: "pop-in 0.45s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted-foreground/50"
              />
            </div>

            <div
              className="space-y-1"
              style={{ animation: "pop-in 0.45s 0.18s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-accent placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                style={{ animation: "pop-in 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity disabled:opacity-50"
              style={{ animation: "pop-in 0.45s 0.26s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              {login.isPending ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          {/* Footer note */}
          <p
            className="text-center text-xs text-muted-foreground"
            style={{ animation: "pop-in 0.45s 0.34s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            Invited by Rooman?{" "}
            <span className="text-accent">Open the link in your invite email</span>{" "}
            to set up your account.
          </p>
        </div>
      </div>
    </div>
  );
}
