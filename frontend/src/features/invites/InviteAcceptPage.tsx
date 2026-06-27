import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Badge, Button, Card, Input, Select, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { acceptInvite, previewInvite } from "@/api/invites.api";
import { useLogin } from "@/features/auth/useAuth";
import { EXPERTISE_DOMAINS, minLen } from "@/lib/validators";
import type { InviteAcceptPayload } from "@/types/api";

const domainOptions = EXPERTISE_DOMAINS.map((d) => ({ value: d, label: d }));

export function InviteAcceptPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const login = useLogin();

  const preview = useQuery({
    queryKey: ["invite", token],
    queryFn: () => previewInvite(token),
    retry: false,
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<InviteAcceptPayload>({
    token,
    password: "",
    full_name: "",
    current_company: "",
    current_title: "",
    expertise_domain: EXPERTISE_DOMAINS[0],
    skills: "",
    location: "",
    linkedin_url: "",
    open_to_mentoring: true,
    open_to_opportunities: true,
    interested_in_startupvarsity: false,
  });

  const set = <K extends keyof InviteAcceptPayload>(k: K, v: InviteAcceptPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const accept = useMutation({
    mutationFn: () => acceptInvite(form),
    onSuccess: () => {
      toast.push("Welcome to connectX! Logging you in…", "success");
      login.mutate(
        { email: preview.data!.email, password: form.password },
        {
          onSuccess: () => navigate("/"),
          onError: () => navigate("/login"),
        },
      );
    },
    onError: () => toast.push("Could not complete registration.", "error"),
  });

  if (preview.isLoading) return <div className="cx-spinner" />;

  if (preview.isError || !preview.data) {
    return (
      <div className="container" style={{ maxWidth: 520, padding: "var(--space-8) 0" }}>
        <Card surface="brutalist">
          <h2>Invite not found</h2>
          <p className="muted">
            This invitation link is invalid or has expired. Please ask Rooman to resend
            your invite.
          </p>
        </Card>
      </div>
    );
  }

  if (preview.data.status === "accepted") {
    return (
      <div className="container" style={{ maxWidth: 520, padding: "var(--space-8) 0" }}>
        <Card surface="brutalist">
          <h2>Already registered</h2>
          <p className="muted">This invite was already used. Head to the login page.</p>
          <Button className="mt-4" onClick={() => navigate("/login")}>
            Go to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="row"
      style={{
        minHeight: "100vh",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "var(--space-8) var(--space-4)",
      }}
    >
      <div style={{ width: "min(560px, 100%)" }}>
        {step === 0 && (
          <Card surface="skeu-cert">
            <Badge>You're invited</Badge>
            <h1 style={{ marginTop: 12 }}>
              Join connectX, {preview.data.full_name ?? "Rooman alumnus"}
            </h1>
            <p className="muted">
              You trained with Rooman
              {preview.data.program_trained ? ` in ${preview.data.program_trained}` : ""}.
              connectX is your private alumni network — here's what you get:
            </p>
            <div className="stack gap-3 mt-4">
              <div className="nb-card" style={{ padding: 14 }}>
                <strong>A community that has your back</strong>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Stay connected with fellow graduates and help each other grow.
                </p>
              </div>
              <div className="nb-card" style={{ padding: 14 }}>
                <strong>Get paid to mentor</strong>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Run mentorship sessions on Rooman programs at industry-standard rates.
                </p>
              </div>
              <div className="nb-card" style={{ padding: 14 }}>
                <strong>Build with StartupVarsity</strong>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Develop your product using Rooman's resources and support.
                </p>
              </div>
            </div>
            <Button block className="mt-6" onClick={() => setStep(1)}>
              Set up my account →
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card surface="brutalist">
            <h2>Create your login</h2>
            <p className="small muted">Registering as {preview.data.email}</p>
            <div className="stack gap-3 mt-4">
              <Input
                label="Full name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Password (min 8 chars)"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="row between mt-6">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Back
              </Button>
              <Button
                onClick={() => {
                  if (!minLen(form.full_name, 2)) return toast.push("Enter your name.", "error");
                  if (!minLen(form.password, 8))
                    return toast.push("Password must be at least 8 characters.", "error");
                  setStep(2);
                }}
              >
                Next →
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card surface="brutalist">
            <h2>Where are you now?</h2>
            <p className="small muted">This helps us match you to the right people.</p>
            <div className="stack gap-3 mt-4">
              <Input
                label="Current company"
                value={form.current_company ?? ""}
                onChange={(e) => set("current_company", e.target.value)}
                placeholder="e.g. Infosys"
              />
              <Input
                label="Current title"
                value={form.current_title ?? ""}
                onChange={(e) => set("current_title", e.target.value)}
                placeholder="e.g. DevOps Engineer"
              />
              <Select
                label="Primary expertise domain"
                options={domainOptions}
                value={form.expertise_domain}
                onChange={(e) => set("expertise_domain", e.target.value)}
              />
              <Input
                label="Key skills (comma separated)"
                value={form.skills ?? ""}
                onChange={(e) => set("skills", e.target.value)}
                placeholder="AWS, Kubernetes, Terraform"
              />
              <Input
                label="Location"
                value={form.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Bengaluru, IN"
              />
              <Input
                label="LinkedIn URL (optional)"
                value={form.linkedin_url ?? ""}
                onChange={(e) => set("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="row between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={() => setStep(3)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card surface="brutalist">
            <h2>How do you want to take part?</h2>
            <p className="small muted">You can change these anytime in your profile.</p>
            <div className="stack gap-4 mt-4">
              <Switch
                checked={!!form.open_to_mentoring}
                onChange={(v) => set("open_to_mentoring", v)}
                label="I'm open to mentoring (paid sessions on Rooman programs)"
              />
              <Switch
                checked={!!form.open_to_opportunities}
                onChange={(v) => set("open_to_opportunities", v)}
                label="I'm open to job opportunities & hiring"
              />
              <Switch
                checked={!!form.interested_in_startupvarsity}
                onChange={(v) => set("interested_in_startupvarsity", v)}
                label="I'm interested in building with StartupVarsity"
              />
            </div>
            <div className="row between mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
                {accept.isPending ? "Creating…" : "Finish & join"}
              </Button>
            </div>
          </Card>
        )}

        <div className="row gap-2 center mt-4" style={{ justifyContent: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "2px solid var(--rooman-ink)",
                background: i <= step ? "var(--rooman-primary)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
