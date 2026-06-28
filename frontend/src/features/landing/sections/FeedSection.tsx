import { motion } from "framer-motion";
import { Avatar } from "@/components/roo/Avatar";
import { CountUp } from "@/components/roo/CountUp";
import { initials, nameToHue } from "@/lib/roo-utils";
import { SectionHeader, SectionCta } from "./SectionHeader";
import { fadeUp, popItem, staggerContainer, viewport } from "./motion";

type FeedPost = {
  id: string;
  author: string;
  batch: string;
  timeAgo: string;
  category: "Hiring" | "General";
  body: string;
  likes: string;
  comments: string;
};

const POSTS: readonly FeedPost[] = [
  {
    id: "p1",
    author: "Aanya Rao",
    batch: "Batch of '19",
    timeAgo: "12m",
    category: "Hiring",
    body: "We're hiring two backend engineers on my team at Stripe. Batch '17–'21 folks, my DMs are open — happy to refer.",
    likes: "128",
    comments: "34",
  },
  {
    id: "p2",
    author: "Vikram Shenoy",
    batch: "Batch of '15",
    timeAgo: "1h",
    category: "General",
    body: "Just shipped my first open-source release after years of lurking. Thank you to everyone in the #side-projects thread for the nudge.",
    likes: "246",
    comments: "52",
  },
  {
    id: "p3",
    author: "Meera Iyer",
    batch: "Batch of '22",
    timeAgo: "3h",
    category: "General",
    body: "Organizing a casual alumni meetup in Bengaluru next month. Drop a comment if you'd like an invite — all batches welcome.",
    likes: "87",
    comments: "19",
  },
] as const;

export function FeedSection() {
  return (
    <section id="feed" className="scroll-mt-20 bg-secondary/40 border-y border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-28">
        {/* TEXT — right on desktop, first on mobile */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="order-1 md:order-2"
        >
          <SectionHeader
            kicker="04"
            eyebrow="Community Feed"
            title={
              <>
                Stay in the loop with{" "}
                <span className="text-accent">every batch.</span>
              </>
            }
            lede="A living stream of posts, hiring updates, and open discussions from across the alumni network — so you never miss what your people are building."
          />
          <div className="mt-8">
            <SectionCta label="See the feed" />
          </div>
        </motion.div>

        {/* VISUAL — left on desktop, second on mobile */}
        <div className="order-2 md:order-1">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="grain relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6"
          >
            {/* device chrome */}
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Live
              </span>
            </div>

            {/* compose bar (decorative) */}
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3">
              <Avatar initials="YOU" hue={28} size={36} />
              <span className="text-sm text-muted-foreground">
                Share an update…
              </span>
              <span className="ml-auto rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                Post
              </span>
            </div>

            {/* feed posts — animate in one-by-one */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="space-y-3"
            >
              {POSTS.map((post) => (
                <motion.article
                  key={post.id}
                  variants={popItem}
                  className="rounded-2xl border border-border bg-background/60 p-4"
                >
                  <header className="flex items-center gap-3">
                    <Avatar
                      initials={initials(post.author)}
                      hue={nameToHue(post.author)}
                      size={40}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="display truncate text-base leading-tight">
                          {post.author}
                        </span>
                        <span className="chip shrink-0">{post.category}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {post.batch} · {post.timeAgo}
                      </div>
                    </div>
                  </header>

                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                    {post.body}
                  </p>

                  <footer className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden>♥</span>
                      <CountUp value={post.likes} className="font-medium text-foreground" />
                      <span>likes</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden>💬</span>
                      <CountUp value={post.comments} className="font-medium text-foreground" />
                      <span>comments</span>
                    </span>
                  </footer>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
