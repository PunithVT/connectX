import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { endorse, listEndorsements, removeEndorsement } from "@/api/endorsements.api";

export function EndorsementsCard({
  userId,
  isOwn,
}: {
  userId: number;
  isOwn: boolean;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [skill, setSkill] = useState("");

  const endorsements = useQuery({
    queryKey: ["endorsements", userId],
    queryFn: () => listEndorsements(userId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["endorsements", userId] });

  const add = useMutation({
    mutationFn: (s: string) => endorse(userId, s),
    onSuccess: () => {
      invalidate();
      setSkill("");
    },
    onError: () =>
      toast.push("Connect with this alumnus first to endorse.", "error"),
  });
  const toggle = useMutation({
    mutationFn: ({ s, mine }: { s: string; mine: boolean }) =>
      mine ? removeEndorsement(userId, s) : endorse(userId, s),
    onSuccess: invalidate,
    onError: () => toast.push("Could not update endorsement.", "error"),
  });

  const data = endorsements.data ?? [];

  return (
    <Card surface="brutalist">
      <h3 style={{ marginTop: 0 }}>Skill endorsements</h3>

      {endorsements.isLoading ? (
        <div className="cx-spinner" />
      ) : !data.length ? (
        <p className="muted">
          {isOwn
            ? "No endorsements yet — connect with alumni and they can vouch for your skills."
            : "No endorsements yet. Be the first to endorse a skill."}
        </p>
      ) : (
        <div className="row wrap gap-2">
          {data.map((s) => (
            <button
              key={s.skill}
              disabled={isOwn || toggle.isPending}
              onClick={() => !isOwn && toggle.mutate({ s: s.skill, mine: s.endorsed_by_me })}
              className="nb-badge"
              title={s.endorsers.map((e) => e.full_name).join(", ")}
              style={{
                cursor: isOwn ? "default" : "pointer",
                background: s.endorsed_by_me
                  ? "var(--rooman-green)"
                  : "var(--surface-raised)",
                color: s.endorsed_by_me ? "#fff" : "var(--rooman-ink)",
                padding: "6px 12px",
              }}
            >
              {s.skill} · {s.count}
            </button>
          ))}
        </div>
      )}

      {!isOwn && (
        <div className="row gap-2 mt-4" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Endorse a skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. Kubernetes"
              onKeyDown={(e) => {
                if (e.key === "Enter" && skill.trim()) add.mutate(skill.trim());
              }}
            />
          </div>
          <Button
            onClick={() => skill.trim() && add.mutate(skill.trim())}
            disabled={add.isPending || !skill.trim()}
          >
            Endorse
          </Button>
        </div>
      )}
    </Card>
  );
}
