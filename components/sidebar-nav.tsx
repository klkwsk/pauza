"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  BookOpen,
  BarChart3,
  User,
  FileText,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function linkClasses(active: boolean) {
    // Stały, przezroczysty border 1px w bazie — zmieniamy tylko jego kolor (bez skoku layoutu).
    // border-[1px] zamiast `border`, bo globals nadpisuje `.border` na 2px.
    return `flex items-center gap-3 rounded-xl border-[1px] px-3 py-2.5 text-base transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
      active
        ? "border-transparent font-bold text-primary"
        : "border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground"
    }`;
  }

  return (
    <aside
      aria-label="Nawigacja główna"
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card px-4 pt-12 pb-6 lg:flex"
    >
      {/* Logo / nazwa aplikacji */}
      <Link
        href="/"
        className="px-3 font-medium leading-none tracking-tight uppercase outline-none focus-visible:underline"
        style={{ fontFamily: "var(--font-chewy)", fontSize: "65px" }}
      >
        Pauza
      </Link>

      {/* Przycisk primary „Dodaj wpis" */}
      <Button
        render={<Link href="/new" />}
        nativeButton={false}
        size="lg"
        className="mt-8 h-11 w-full justify-start gap-3 px-3 text-base"
      >
        <Plus className="size-5" />
        Dodaj wpis
      </Button>

      {/* Nawigacja po funkcjach aplikacji */}
      <nav className="mt-6 flex flex-col gap-1">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={linkClasses(pathname === "/")}
        >
          <BookOpen className="size-5" />
          Wpisy
        </Link>

        <Link
          href="/stats"
          aria-current={pathname.startsWith("/stats") ? "page" : undefined}
          className={linkClasses(pathname.startsWith("/stats"))}
        >
          <BarChart3 className="size-5" />
          Podsumowanie
        </Link>
      </nav>

      {/* Sekcja dolna — przypięta do dołu (lewy dolny róg) */}
      <div className="mt-auto flex flex-col gap-1">
        {/* Elementy systemowe — oddzielone od nawigacji funkcjami */}
        <nav
          aria-label="Konto i ustawienia"
          className="flex flex-col gap-1"
        >
          {/* Dane Konta — placeholder (pusty link, bez akcji) */}
          <button
            type="button"
            aria-disabled
            className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-muted-foreground/60 outline-none"
          >
            <User className="size-5" />
            Dane Konta
          </button>

          <Link
            href="/docs"
            aria-current={pathname.startsWith("/docs") ? "page" : undefined}
            className={linkClasses(pathname.startsWith("/docs"))}
          >
            <FileText className="size-5" />
            Dokumentacja
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-xl border-[1px] border-transparent px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors outline-none hover:border-border hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <LogOut className="size-5" />
            Wyloguj się
          </button>
        </nav>
      </div>
    </aside>
  );
}
