import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const navLinks = [
  { to: "/", label: "Home", hash: false },
  { to: "#feed", label: "Feed", hash: true },
  { to: "#directory", label: "Directory", hash: true },
  { to: "#mentorship", label: "Mentorship", hash: true },
  { to: "#startups", label: "Startups", hash: true },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">
            <span className="display text-lg leading-none">R</span>
          </span>
          <span className="display text-xl tracking-tight">
            Rooman<span className="text-accent">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) =>
            l.hash ? (
              <a
                key={l.to}
                href={l.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden text-sm text-muted-foreground hover:text-foreground md:inline"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="display text-2xl">Rooman Connect</div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            An exclusive network for the 500,000+ professionals trained by Rooman over the
            last 25 years.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Network
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/feed">Community Feed</Link>
            </li>
            <li>
              <Link to="/directory">Alumni Directory</Link>
            </li>
            <li>
              <Link to="/mentorship">Mentorship</Link>
            </li>
            <li>
              <Link to="/startupvarsity">Startup Hub</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Get started
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/profile">Your profile</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Rooman Connect</span>
          <span>Made for alumni, by alumni.</span>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
