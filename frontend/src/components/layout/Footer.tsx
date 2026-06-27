export function Footer() {
  return (
    <footer
      className="container center small muted"
      style={{ padding: "var(--space-8) 0 var(--space-6)" }}
    >
      connectX — the Rooman alumni network · Built for 500,000+ graduates ·{" "}
      © {new Date().getFullYear()} Rooman Technologies
    </footer>
  );
}
