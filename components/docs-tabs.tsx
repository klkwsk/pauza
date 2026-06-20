"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// Przełącznik zakładek dokumentacji (API / MCP). Aktywna trasa = ramka 1px,
// spójnie z aktywnym stanem w sidebarze aplikacji.
const TABS = [
  { href: "/docs", label: "API" },
  { href: "/docs/mcp", label: "MCP" },
];

export function DocsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border-[1px] px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
