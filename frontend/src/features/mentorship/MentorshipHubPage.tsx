import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MentorCard } from "@/components/roo/MentorCard";
import { listMentors } from "@/api/mentorship.api";

export function MentorshipHubPage() {
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: listMentors,
    staleTime: 60_000,
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Mentorship
          </div>
          <h1 className="mt-2 display text-4xl leading-tight md:text-5xl">
            Learn from alumni who've{" "}
            <span className="italic text-accent">already</span> done it.
          </h1>
        </div>
        <div className="md:pt-4">
          <p className="text-muted-foreground">
            Book 1:1 sessions with senior Rooman alumni working at top product companies.
            All mentors are vetted by the community — and pricing stays transparent.
          </p>
          <Link
            to="/mentorship/become"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Become a mentor →
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-20 text-center text-muted-foreground">Loading mentors…</div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
          {mentors.length === 0 && (
            <p className="col-span-3 text-center text-muted-foreground">
              No mentors listed yet.{" "}
              <Link to="/mentorship/become" className="text-accent underline">
                Be the first →
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
