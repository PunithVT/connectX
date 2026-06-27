import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppShell() {
  const isWide = useMediaQuery("(min-width: 880px)");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        {isWide && (
          <aside className="w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>
        )}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
