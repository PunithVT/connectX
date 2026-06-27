import { Outlet } from "react-router-dom";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppShell() {
  const isWide = useMediaQuery("(min-width: 880px)");

  return (
    <div className="stack" style={{ minHeight: "100%" }}>
      <Navbar />
      <main
        className="container grow"
        style={{
          display: "grid",
          width: "100%",
          gridTemplateColumns: isWide ? "220px minmax(0, 1fr)" : "1fr",
          gap: "var(--space-6)",
          padding: "var(--space-6) var(--space-4)",
          alignItems: "start",
        }}
      >
        {isWide && (
          <div style={{ position: "sticky", top: 84 }}>
            <Sidebar />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
