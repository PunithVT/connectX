import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/roo/Shell";
import { Avatar } from "@/components/roo/Avatar";
import { OrbitBg } from "@/components/roo/OrbitBg";
import { Reveal } from "@/components/roo/Reveal";
import { CountUp } from "@/components/roo/CountUp";
import { listProfiles } from "@/api/profile.api";
import { useAuthStore } from "@/store";
import { initials, nameToHue } from "@/lib/roo-utils";
import { DirectorySection } from "./sections/DirectorySection";
import { MentorshipSection } from "./sections/MentorshipSection";
import { StartupsSection } from "./sections/StartupsSection";
import { FeedSection } from "./sections/FeedSection";

const STATIC_STATS = [
  { v: "52,840", l: "Members" },
  { v: "1,240", l: "Active Mentors" },
  { v: "386+", l: "Open Roles" },
  { v: "94", l: "Startup Projects" },
];

const benefits = [
  {
    kicker: "01",
    title: "Alumni Community",
    body: "Reconnect with the 500,000+ professionals you trained alongside.",
  },
  {
    kicker: "02",
    title: "Career Opportunities",
    body: "Hiring posts and warm intros from senior alumni at top companies.",
  },
  {
    kicker: "03",
    title: "Paid Mentorship",
    body: "Book vetted mentors from Razorpay, Swiggy, Microsoft, and more.",
  },
  {
    kicker: "04",
    title: "Startup Support",
    body: "Find co-founders, hires, and early customers via StartupVarsity.",
  },
];

export function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return <LandingContent />;
}

function LandingContent() {
  const { data: profiles } = useQuery({
    queryKey: ["profiles", "strip"],
    queryFn: () => listProfiles(),
    staleTime: 5 * 60_000,
  });

  const strip = (profiles ?? []).slice(0, 5);

  return (
    <Shell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-0 px-6 py-20 md:grid-cols-2 md:py-28">

          {/* ── Left: text ── */}
          <div className="relative z-10 pb-12 md:pb-0 md:pr-10">
            <Reveal
              as="div"
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              <span className="h-px w-8 bg-foreground/40" />
              Est. 1999 · 25 years of Rooman
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-6 display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.95]">
                The network for
                <br />
                <span className="italic text-accent">half a million</span>
                <br />
                Rooman alumni.
              </h1>
            </Reveal>
            <Reveal delay={260}>
              <p className="mt-8 max-w-md text-lg text-muted-foreground">
                Connect with peers, share opportunities, mentor the next generation, and build
                startups — all inside one trusted alumni circle.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
                >
                  Join the alumni network
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-6 py-3.5 text-sm font-medium backdrop-blur hover:bg-secondary"
                >
                  Browse community feed
                </Link>
              </div>
            </Reveal>

            {strip.length > 0 && (
              <Reveal delay={560}>
                <div className="mt-12 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {strip.map((p) => {
                      const name = p.user?.full_name ?? "";
                      return (
                        <div key={p.id} className="rounded-full ring-2 ring-background">
                          <Avatar initials={initials(name)} hue={nameToHue(name)} size={40} />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <CountUp value="52,840" className="font-medium text-foreground" /> alumni
                    and counting
                  </p>
                </div>
              </Reveal>
            )}
          </div>

          {/* ── Right: orbit animation ── */}
          <div className="relative hidden h-[600px] overflow-hidden md:block">
            <OrbitBg />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {STATIC_STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 90} className="px-6 py-8">
              <div className="display text-4xl md:text-5xl">
                <CountUp value={s.v} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why join
            </div>
            <h2 className="mt-3 display text-4xl leading-tight md:text-5xl">
              Built around the
              <br />
              things alumni
              <br />
              <span className="italic text-accent">actually</span> ask for.
            </h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-2">
            {benefits.map((b, i) => (
              <Reveal key={b.kicker} delay={i * 110}>
                <div className="h-full bg-card p-7 transition-colors hover:bg-secondary/60">
                  <div className="font-mono text-xs text-accent">{b.kicker}</div>
                  <h3 className="mt-4 display text-2xl">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SECTIONS */}
      <DirectorySection />
      <MentorshipSection />
      <StartupsSection />
      <FeedSection />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-background md:px-16 md:py-24">
            <h2 className="display text-4xl leading-tight md:text-6xl">
              One network.
              <br />
              <span className="italic text-accent">Every</span> Rooman batch.
            </h2>
            <p className="mt-6 max-w-md text-background/70">
              Whether you graduated in 2001 or last semester — there's a peer, mentor, or
              founder here waiting to hear from you.
            </p>
            <Link
              to="/login"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground"
            >
              Claim your alumni profile →
            </Link>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}
