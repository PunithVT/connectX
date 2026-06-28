import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StartupCard } from "@/components/roo/StartupCard";
import { listProjects, applyForResources } from "@/api/startupvarsity.api";

export function StartupVarsityPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    pitch: "",
    stage: "idea" as "idea" | "prototype" | "mvp" | "revenue",
    resources_requested: "",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["startupvarsity"],
    queryFn: listProjects,
    staleTime: 60_000,
  });

  const applyMutation = useMutation({
    mutationFn: applyForResources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startupvarsity"] });
      setShowForm(false);
      setForm({ name: "", pitch: "", stage: "idea", resources_requested: "" });
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Startup Hub
          </div>
          <h1 className="mt-2 display text-4xl leading-tight md:text-5xl">
            Build the next one
            <br />
            with your <span className="italic text-accent">batch</span>.
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="hidden text-right text-sm text-muted-foreground md:block">
            Powered by{" "}
            <span className="font-medium text-foreground">StartupVarsity</span>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            {showForm ? "Cancel" : "List your startup →"}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6">
        <strong className="display text-lg">
          Build your product with Rooman's resources.
        </strong>
        <p className="mt-1 text-sm text-muted-foreground">
          Alumni founders can apply for compute, mentorship, and lab access to develop
          their products under StartupVarsity. Pitch your idea and request what you need.
        </p>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyMutation.mutate(form);
          }}
          className="mt-8 rounded-3xl border border-border bg-card p-6"
        >
          <h2 className="display text-2xl">List your startup</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Startup name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Stage
              </label>
              <select
                value={form.stage}
                onChange={(e) =>
                  setForm({ ...form, stage: e.target.value as typeof form.stage })
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="idea">Idea</option>
                <option value="prototype">Prototype</option>
                <option value="mvp">MVP</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Pitch
              </label>
              <textarea
                rows={3}
                value={form.pitch}
                onChange={(e) => setForm({ ...form, pitch: e.target.value })}
                className="mt-1 w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                What are you looking for?
              </label>
              <input
                value={form.resources_requested}
                onChange={(e) =>
                  setForm({ ...form, resources_requested: e.target.value })
                }
                placeholder="e.g. Co-founder (CTO), Seed funding, Design help"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={applyMutation.isPending || !form.name}
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {applyMutation.isPending ? "Submitting…" : "Submit startup"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="mt-20 text-center text-muted-foreground">Loading startups…</div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <StartupCard key={p.id} project={p} />
          ))}
          {projects.length === 0 && (
            <p className="col-span-2 text-center text-muted-foreground">
              No startup projects yet. List yours above!
            </p>
          )}
        </div>
      )}
    </section>
  );
}
