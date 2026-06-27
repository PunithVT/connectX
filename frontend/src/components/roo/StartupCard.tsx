import type { StartupProject } from "@/types/models";

export function StartupCard({ project }: { project: StartupProject }) {
  const founder = project.owner?.full_name ?? "Unknown";

  return (
    <article className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="display text-2xl">{project.name}</div>
          <div className="text-sm text-muted-foreground">by {founder}</div>
        </div>
        <span className="chip border-accent/40 text-accent">{project.stage}</span>
      </header>
      {project.pitch && (
        <p className="text-sm text-foreground/80">{project.pitch}</p>
      )}
      {project.resources_requested && (
        <div className="rounded-2xl bg-secondary px-4 py-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Looking for
          </div>
          <div className="mt-1 display text-xl">{project.resources_requested}</div>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs capitalize text-muted-foreground">{project.status}</span>
        <button
          disabled
          className="cursor-default rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background opacity-60"
          title="Interest signaling not yet available"
        >
          I'm Interested →
        </button>
      </div>
    </article>
  );
}
