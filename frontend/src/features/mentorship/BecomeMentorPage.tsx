import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { becomeMentor } from "@/api/mentorship.api";
import { rupees } from "@/lib/format";
import type { BecomeMentorPayload } from "@/types/api";

export function BecomeMentorPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<BecomeMentorPayload>({
    programs: "",
    headline: "",
    bio: "",
    hourly_rate: 1500,
  });
  const set = <K extends keyof BecomeMentorPayload>(k: K, v: BecomeMentorPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => becomeMentor(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.push("You're now listed as a mentor!", "success");
      navigate("/mentorship");
    },
    onError: () => toast.push("Could not save mentor profile.", "error"),
  });

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Become a mentor</h1>

      <Card surface="neu">
        <strong>How mentorship pay works</strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Set your hourly rate. When alumni book sessions on Rooman programs, you're paid
          at the rate you set — aligned to industry standards.
        </p>
      </Card>

      <Card surface="brutalist">
        <div className="stack gap-3">
          <Input
            label="Headline"
            value={form.headline ?? ""}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Senior Cloud Architect · 8 yrs"
          />
          <Input
            label="Programs you mentor (comma separated)"
            value={form.programs ?? ""}
            onChange={(e) => set("programs", e.target.value)}
            placeholder="AWS Cloud, DevOps, Kubernetes"
          />
          <Textarea
            label="Short bio"
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            rows={4}
          />
          <Input
            label="Hourly rate (INR)"
            type="number"
            min={0}
            step={100}
            value={form.hourly_rate}
            onChange={(e) => set("hourly_rate", Number(e.target.value))}
          />
          <span className="small muted">
            Mentees will see {rupees(form.hourly_rate || 0)}/hr.
          </span>
          <div className="row between mt-2">
            <Button variant="ghost" onClick={() => navigate("/mentorship")}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "List me as a mentor"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
