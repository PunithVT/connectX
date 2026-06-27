import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Input, Select, Switch, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { fetchMyProfile, updateMyProfile } from "@/api/profile.api";
import { EXPERTISE_DOMAINS } from "@/lib/validators";
import type { AlumniProfile } from "@/types/models";

const domainOptions = EXPERTISE_DOMAINS.map((d) => ({ value: d, label: d }));

export function ProfileEditPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: fetchMyProfile });
  const [form, setForm] = useState<Partial<AlumniProfile>>({});

  useEffect(() => {
    if (profile.data) setForm(profile.data);
  }, [profile.data]);

  const set = <K extends keyof AlumniProfile>(k: K, v: AlumniProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => updateMyProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.push("Profile updated.", "success");
      navigate("/profile");
    },
    onError: () => toast.push("Could not save profile.", "error"),
  });

  if (profile.isLoading) return <div className="cx-spinner" />;

  return (
    <div className="stack gap-6">
      <h1 className="page-title">Edit profile</h1>
      <Card surface="brutalist">
        <div className="stack gap-3">
          <Input
            label="Headline"
            value={form.headline ?? ""}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="DevOps Engineer turning coffee into pipelines"
          />
          <Textarea
            label="Bio"
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            rows={4}
          />
          <div className="row gap-3 wrap">
            <Input
              label="Current company"
              value={form.current_company ?? ""}
              onChange={(e) => set("current_company", e.target.value)}
            />
            <Input
              label="Current title"
              value={form.current_title ?? ""}
              onChange={(e) => set("current_title", e.target.value)}
            />
          </div>
          <Select
            label="Expertise domain"
            options={domainOptions}
            value={form.expertise_domain ?? EXPERTISE_DOMAINS[0]}
            onChange={(e) => set("expertise_domain", e.target.value)}
          />
          <Input
            label="Skills (comma separated)"
            value={form.skills ?? ""}
            onChange={(e) => set("skills", e.target.value)}
          />
          <div className="row gap-3 wrap">
            <Input
              label="Location"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
            />
            <Input
              label="LinkedIn URL"
              value={form.linkedin_url ?? ""}
              onChange={(e) => set("linkedin_url", e.target.value)}
            />
          </div>

          <div className="stack gap-3 mt-2">
            <Switch
              checked={!!form.open_to_mentoring}
              onChange={(v) => set("open_to_mentoring", v)}
              label="Open to mentoring"
            />
            <Switch
              checked={!!form.open_to_opportunities}
              onChange={(v) => set("open_to_opportunities", v)}
              label="Open to opportunities"
            />
            <Switch
              checked={!!form.interested_in_startupvarsity}
              onChange={(v) => set("interested_in_startupvarsity", v)}
              label="Interested in StartupVarsity"
            />
          </div>

          <div className="row between mt-4">
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
