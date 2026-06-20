"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DocsTabs } from "@/components/docs-tabs";
import { ApiKeysManager } from "@/components/api-keys-manager";

// Wspólny górny pasek dokumentacji (styl Vercel docs): wordmark + zakładki API/MCP
// + generator tokenu. Pasek jest sticky i wspólny dla obu zakładek. Generator
// (ApiKeysManager) jest tu zamontowany na stałe — zwijamy go klasą `hidden`, więc
// świeżo wygenerowany klucz nie znika po zwinięciu ani po przełączeniu zakładki.
export function DocsTopBar() {
  const [keysOpen, setKeysOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-heading text-lg font-medium tracking-tight">
          Pauza <span className="text-muted-foreground">· Dokumentacja</span>
        </Link>

        <DocsTabs />

        <div className="ml-auto">
          <Button
            variant={keysOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setKeysOpen((v) => !v)}
            aria-expanded={keysOpen}
          >
            {keysOpen ? "Ukryj klucze API" : "Klucze API"}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t bg-card/50",
          keysOpen ? "block" : "hidden",
        )}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-5">
          <div className="mb-3">
            <p className="text-sm font-medium">Twoje klucze API</p>
            <p className="text-xs text-muted-foreground">
              Ten sam klucz uwierzytelnia REST API i serwer MCP. Pełny klucz pokazujemy
              tylko raz — zapisz go bezpiecznie. Traktuj go jak hasło.
            </p>
          </div>
          <ApiKeysManager />
        </div>
      </div>
    </header>
  );
}
