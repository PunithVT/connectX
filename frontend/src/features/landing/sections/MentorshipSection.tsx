import { motion } from "framer-motion";
import { Avatar } from "@/components/roo/Avatar";
import { initials, nameToHue } from "@/lib/roo-utils";
import { SectionHeader, SectionCta } from "./SectionHeader";
import { popItem, staggerContainer, viewport } from "./motion";

/** A senior alumnus available for paid 1:1 sessions. */
type Mentor = {
  name: string;
  headline: string;
  price: string;
};

const MENTORS: Mentor[] = [
  { name: "Priya Menon", headline: "Sr. PM · Razorpay", price: "₹2,500 / session" },
  { name: "Arjun Shetty", headline: "Eng Lead · Swiggy", price: "₹3,000 / session" },
  { name: "Neha Kapoor", headline: "Group PM · Microsoft", price: "₹4,000 / session" },
  { name: "Rohan Iyer", headline: "Design Director · Cred", price: "₹2,800 / session" },
  { name: "Sara Khan", headline: "Staff SWE · Flipkart", price: "₹3,500 / session" },
];

/** The booking flow shown as a connected 3-step row. */
const STEPS: { n: string; label: string }[] = [
  { n: "1", label: "Pick a mentor" },
  { n: "2", label: "Choose a slot" },
  { n: "3", label: "Confirm & pay" },
];

function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar
          initials={initials(mentor.name)}
          hue={nameToHue(mentor.name)}
          size={44}
        />
        <div className="min-w-0">
          <p className="display text-lg leading-tight">{mentor.name}</p>
          <p className="truncate text-sm text-muted-foreground">{mentor.headline}</p>
        </div>
      </div>
      <span className="chip w-fit bg-accent text-accent-foreground">{mentor.price}</span>
    </div>
  );
}

export function MentorshipSection() {
  return (
    <section
      id="mentorship"
      className="grain scroll-mt-20 border-y border-border bg-secondary/40"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-28">
        {/* VISUAL — left on md, second on mobile */}
        <div className="order-2 flex flex-col gap-6 md:order-1">
          {/* Auto-scrolling mentor marquee */}
          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div className="flex w-max gap-4 animate-marquee">
              {[...MENTORS, ...MENTORS].map((mentor, i) => (
                <MentorCard key={`${mentor.name}-${i}`} mentor={mentor} />
              ))}
            </div>
          </div>

          {/* Step-by-step booking flow */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center"
          >
            {STEPS.map((step, i) => {
              const isLast = i === STEPS.length - 1;
              return (
                <motion.div
                  key={step.n}
                  variants={popItem}
                  className="flex items-center gap-3 md:flex-1"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-medium " +
                        (isLast
                          ? "bg-accent text-accent-foreground"
                          : "bg-foreground text-background")
                      }
                    >
                      {step.n}
                    </span>
                    <span
                      className={
                        "text-sm font-medium " + (isLast ? "text-accent" : "text-foreground")
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <span
                      aria-hidden
                      className="hidden flex-1 items-center text-muted-foreground md:flex"
                    >
                      <span className="h-px flex-1 bg-border" />
                      <span className="-ml-1">→</span>
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* TEXT — right on md, first on mobile */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="order-1 flex flex-col items-start gap-7 md:order-2"
        >
          <SectionHeader
            kicker="02"
            eyebrow="Paid Mentorship"
            title={
              <>
                Book vetted mentors
                <br />
                who&apos;ve done it.
              </>
            }
            lede="Sit down 1:1 with senior alumni from Razorpay, Swiggy, Microsoft and more. Every paid session is with a vetted operator who has shipped the thing you're trying to build — no fluff, just the real playbook."
          />
          <SectionCta label="Find a mentor" />
        </motion.div>
      </div>
    </section>
  );
}
