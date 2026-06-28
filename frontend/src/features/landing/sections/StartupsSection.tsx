import { motion } from "framer-motion";
import { Avatar } from "@/components/roo/Avatar";
import { CountUp } from "@/components/roo/CountUp";
import { initials, nameToHue } from "@/lib/roo-utils";
import { SectionHeader, SectionCta } from "./SectionHeader";
import { fadeUp, popItem, staggerContainer, viewport } from "./motion";

type StartupProject = {
  name: string;
  founder: string;
  stage: string;
  pitch: string;
  lookingFor: string[];
};

const PROJECTS: readonly StartupProject[] = [
  {
    name: "Loamly",
    founder: "Ade Okonkwo",
    stage: "Pre-seed",
    pitch: "Soil-health analytics that help small farms plan smarter seasons.",
    lookingFor: ["Co-founder", "React dev", "Pilot farms"],
  },
  {
    name: "Cadence",
    founder: "Priya Raman",
    stage: "MVP",
    pitch: "A calmer scheduling layer for clinics drowning in no-shows.",
    lookingFor: ["Design partner", "Backend hire", "First customers"],
  },
  {
    name: "Foundry Notes",
    founder: "Marco Bellini",
    stage: "Seed",
    pitch: "Lightweight knowledge base built for fast-moving founding teams.",
    lookingFor: ["Growth lead", "React dev"],
  },
] as const;

export function StartupsSection() {
  return (
    <section
      id="startups"
      className="scroll-mt-20 mx-auto max-w-7xl px-6 py-24 md:py-28"
    >
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
        {/* Left — editorial text */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <SectionHeader
            kicker="03"
            eyebrow="StartupVarsity"
            title={
              <>
                Build your startup with the
                <span className="text-accent"> network behind you</span>.
              </>
            }
            lede="Find co-founders, early hires, and your first customers among alumni who already know your context — and want to back what you build."
          />

          <motion.div
            variants={fadeUp}
            className="mt-8 flex items-baseline gap-3"
          >
            <span className="display text-5xl text-accent">
              <CountUp value="94" />
            </span>
            <span className="text-sm text-muted-foreground">
              active projects
              <br />
              raising, hiring &amp; shipping
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-9">
            <SectionCta label="Explore startups" />
          </motion.div>
        </motion.div>

        {/* Right — matching motif */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative"
        >
          {/* Decorative connecting lines */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full text-accent/40"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <motion.path
              d="M 18 22 C 40 32, 55 40, 82 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              variants={drawPath}
            />
            <motion.path
              d="M 20 72 C 42 64, 60 58, 80 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              variants={drawPath}
            />
          </svg>

          <div className="relative flex flex-col gap-4">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: [0.2, 0.7, 0.2, 1] as const },
  },
};

function ProjectCard({ project }: { project: StartupProject }) {
  const hue = nameToHue(project.founder);
  return (
    <motion.div
      variants={popItem}
      className="grain relative overflow-hidden rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="display text-2xl leading-tight">{project.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Avatar initials={initials(project.founder)} hue={hue} size={24} />
            <span className="text-sm text-muted-foreground">
              by {project.founder}
            </span>
          </div>
        </div>
        <span className="chip shrink-0 bg-secondary text-foreground">
          {project.stage}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{project.pitch}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Looking for
        </span>
        {project.lookingFor.map((tag) => (
          <motion.span
            key={tag}
            variants={popItem}
            className="chip border border-border bg-accent/10 text-accent"
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
