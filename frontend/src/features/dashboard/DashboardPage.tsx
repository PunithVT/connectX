import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/roo/Reveal";
import { Avatar } from "@/components/roo/Avatar";
import { listFeed } from "@/api/feed.api";
import { useCurrentUser } from "@/features/auth/useAuth";
import { timeAgo, POST_TYPE_LABELS, initials, nameToHue } from "@/lib/roo-utils";
import type { PostType } from "@/types/models";

const quickActions = [
  { to: "/feed", label: "Share an update", desc: "Post to the community feed", icon: "✍" },
  { to: "/directory", label: "Find alumni", desc: "Search by skill or company", icon: "⌕" },
  { to: "/mentorship", label: "Book a mentor", desc: "1:1 with senior alumni", icon: "◈" },
  { to: "/startupvarsity", label: "Join a startup", desc: "Open roles & co-founder calls", icon: "▲" },
] as const;

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: posts } = useQuery({
    queryKey: ["feed", "dashboard"],
    queryFn: () => listFeed(3, 0),
    staleTime: 30_000,
  });

  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const recent = (posts ?? []).slice(0, 3);

  return (
    <>
      {/* Banner */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Welcome back
              </div>
              <h1 className="mt-2 display text-4xl md:text-5xl">Hey {firstName} 👋</h1>
              <p className="mt-2 text-muted-foreground">
                Here's what's happening in your network.
              </p>
            </div>
            <Link
              to="/profile"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm"
            >
              View your profile →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Quick actions */}
          <div>
            <h2 className="display text-2xl">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickActions.map((a, i) => (
                <Reveal key={a.to} delay={i * 60}>
                  <Link
                    to={a.to}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="display text-2xl text-accent">{a.icon}</div>
                    <div>
                      <div className="font-medium">{a.label}</div>
                      <div className="text-sm text-muted-foreground">{a.desc}</div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Recent posts */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl">Recent in feed</h2>
              <Link to="/feed" className="text-sm text-accent">
                See all →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recent.map((p) => {
                const name = p.author?.full_name ?? "Unknown";
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Avatar initials={initials(name)} hue={nameToHue(name)} size={28} />
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">· {timeAgo(p.created_at)}</span>
                      <span className="chip ml-auto">
                        {POST_TYPE_LABELS[p.post_type as PostType] ?? p.post_type}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm">{p.body}</p>
                  </div>
                );
              })}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No posts yet.{" "}
                  <Link to="/feed" className="text-accent underline">
                    Be the first to share something →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
