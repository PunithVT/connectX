import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, staggerContainer, viewport } from "./motion";

/**
 * Shared editorial header for a landing feature section.
 * Renders an ember kicker number, an eyebrow label, a Fraunces title and a lede.
 */
export function SectionHeader({
  kicker,
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  kicker: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}
    >
      <motion.div
        variants={fadeUp}
        className={
          "flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground" +
          (align === "center" ? " justify-center" : "")
        }
      >
        <span className="font-mono text-accent">{kicker}</span>
        <span className="h-px w-8 bg-foreground/30" />
        {eyebrow}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="mt-4 display text-4xl leading-[1.05] md:text-5xl"
      >
        {title}
      </motion.h2>
      {lede && (
        <motion.p
          variants={fadeUp}
          className="mt-5 text-lg text-muted-foreground"
        >
          {lede}
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * Shared CTA button used at the bottom of each feature section.
 */
export function SectionCta({ label = "Join to explore" }: { label?: string }) {
  return (
    <motion.a
      variants={fadeUp}
      href="/login"
      className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
    >
      {label}
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </motion.a>
  );
}
