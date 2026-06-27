import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/roo/Avatar";
import { CountUp } from "@/components/roo/CountUp";
import { initials, nameToHue } from "@/lib/roo-utils";
import { fadeUp, popItem, staggerContainer, viewport } from "./motion";
import { SectionCta, SectionHeader } from "./SectionHeader";

/** Queries the mock search bar cycles through, typewriter-style. */
const QUERIES = [
  "Backend engineers in Bengaluru",
  "2018 batch · Razorpay",
  "Product mentors",
  "Co-founders in fintech",
] as const;

/** Filter pills shown under the search bar. */
const FILTERS = ["All", "Batch", "Company", "Skill", "City"] as const;
const ACTIVE_FILTER = "Company";

type AlumResult = {
  name: string;
  title: string;
  company: string;
  skills: string[];
};

/** Static showcase data for the faux directory results. */
const RESULTS: AlumResult[] = [
  {
    name: "Aarav Rao",
    title: "Staff Engineer",
    company: "Razorpay",
    skills: ["Go", "Payments"],
  },
  {
    name: "Diya Menon",
    title: "Product Lead",
    company: "Swiggy",
    skills: ["0→1", "Growth"],
  },
  {
    name: "Kabir Shah",
    title: "Co-founder",
    company: "Ledgerly",
    skills: ["Fintech", "Fundraising"],
  },
  {
    name: "Ishaan Verma",
    title: "ML Engineer",
    company: "Sarvam AI",
    skills: ["LLMs", "Python"],
  },
  {
    name: "Ananya Iyer",
    title: "Engineering Mgr",
    company: "Flipkart",
    skills: ["Platform", "Hiring"],
  },
  {
    name: "Rohan Gupta",
    title: "Design Lead",
    company: "CRED",
    skills: ["Brand", "Systems"],
  },
];

/** Drives a character-by-character typewriter across the QUERIES list. */
function useTypewriter(reduced: boolean): string {
  const [text, setText] = useState(reduced ? QUERIES[0] : "");

  useEffect(() => {
    if (reduced) {
      setText(QUERIES[0]);
      return;
    }

    let queryIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const full = QUERIES[queryIdx];
      if (!deleting) {
        charIdx += 1;
        setText(full.slice(0, charIdx));
        if (charIdx === full.length) {
          deleting = true;
          timer = setTimeout(step, 1600);
          return;
        }
        timer = setTimeout(step, 55);
      } else {
        charIdx -= 1;
        setText(full.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          queryIdx = (queryIdx + 1) % QUERIES.length;
          timer = setTimeout(step, 300);
          return;
        }
        timer = setTimeout(step, 28);
      }
    };

    timer = setTimeout(step, 600);
    return () => clearTimeout(timer);
  }, [reduced]);

  return text;
}

export function DirectorySection() {
  const reduced = useReducedMotion() ?? false;
  const typed = useTypewriter(reduced);

  return (
    <section
      id="directory"
      className="scroll-mt-20 grain bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2 md:gap-16 md:py-28">
        {/* Left: editorial copy */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <SectionHeader
            kicker="01"
            eyebrow="Alumni Directory"
            title={
              <>
                Find any alum
                <br />
                in <span className="text-accent">seconds.</span>
              </>
            }
            lede="Search 500,000+ Rooman alumni by batch, company, skill, or city. The whole network, one box away — no cold intros, no guesswork."
          />

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            <div>
              <div className="display text-3xl">
                <CountUp value="52,840" />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                profiles indexed
              </div>
            </div>
            <div className="h-10 w-px bg-border" aria-hidden />
            <div>
              <div className="display text-3xl">
                <CountUp value="1,400+" />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                companies represented
              </div>
            </div>
          </motion.div>

          <div className="mt-9">
            <SectionCta label="Browse the directory" />
          </div>
        </motion.div>

        {/* Right: faux directory search UI */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"
        >
          {/* Search bar */}
          <motion.div
            variants={popItem}
            className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 shrink-0 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <span className="truncate text-sm md:text-base">
              {typed}
              {!reduced && (
                <motion.span
                  className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] bg-accent align-middle"
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  aria-hidden
                />
              )}
            </span>
          </motion.div>

          {/* Filter chips */}
          <motion.div
            variants={popItem}
            className="mt-4 flex flex-wrap gap-2"
          >
            {FILTERS.map((f) => {
              const active = f === ACTIVE_FILTER;
              return (
                <motion.span
                  key={f}
                  className={
                    "chip select-none transition-colors " +
                    (active
                      ? "border-transparent bg-accent text-accent-foreground"
                      : "text-muted-foreground")
                  }
                  animate={
                    active && !reduced ? { y: [0, -2, 0] } : undefined
                  }
                  transition={
                    active && !reduced
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : undefined
                  }
                >
                  {f}
                </motion.span>
              );
            })}
          </motion.div>

          {/* Results grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {RESULTS.map((r, i) => (
              <motion.div
                key={r.name}
                variants={popItem}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3.5"
              >
                <div className={!reduced && i % 2 === 0 ? "animate-floaty" : ""}>
                  <Avatar
                    initials={initials(r.name)}
                    hue={nameToHue(r.name)}
                    size={44}
                  />
                </div>
                <div className="min-w-0">
                  <div className="display text-base leading-tight">
                    {r.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.title} · {r.company}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.skills.map((s) => (
                      <span
                        key={s}
                        className="chip bg-secondary text-xs text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
