"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

// Ikony z Heroicons (outline) — wstawione inline, bo projekt nie ma @heroicons/react
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  // Ukryj pasek w formularzu wpisu (nowy wpis oraz edycja) i na ekranie logowania
  if (pathname === "/new" || pathname.endsWith("/edit") || pathname === "/login")
    return null;

  const isHome = pathname === "/";
  const isStats = pathname.startsWith("/stats");

  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card px-2 py-1 shadow-lg ring-1 ring-black/5"
    >
      <Link
        href="/"
        aria-label="Wpisy"
        aria-current={isHome ? "page" : undefined}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          isHome
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BookOpenIcon className="h-6 w-6" />
      </Link>

      <Link
        href="/new"
        aria-label="Dodaj wpis"
        className="-my-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <Link
        href="/stats"
        aria-label="Statystyki"
        aria-current={isStats ? "page" : undefined}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          isStats
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ChartBarIcon className="h-6 w-6" />
      </Link>
    </nav>
  );
}
