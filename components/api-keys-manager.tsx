"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface ApiKeyMeta {
  id: string;
  key_prefix: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Interaktywne zarządzanie kluczami API (generowanie/listowanie/odwoływanie).
// Osadzane na publicznej stronie /docs — działa tylko dla zalogowanych
// (operacje idą sesyjnie przez /api/keys); gościom pokazuje zachętę do logowania.
export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/keys");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAuthed(true);
      setKeys(data.keys ?? []);
    } catch {
      toast.error("Nie udało się pobrać kluczy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setFreshKey(null);
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFreshKey(data.key);
      setKeys((prev) => [data.meta, ...prev]);
    } catch {
      toast.error("Nie udało się utworzyć klucza.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("Klucz odwołany.");
    } catch {
      toast.error("Nie udało się odwołać klucza.");
    }
  }

  async function copyKey() {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      toast.success("Skopiowano klucz.");
    } catch {
      toast.error("Nie udało się skopiować.");
    }
  }

  if (!authed) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm">
        <Link href="/login" className="underline underline-offset-4">
          Zaloguj się
        </Link>{" "}
        do Pauzy, aby wygenerować klucz API.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleGenerate} disabled={generating} className="self-start">
        {generating ? "Generuję…" : "Wygeneruj nowy klucz"}
      </Button>

      {freshKey && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium">
            Skopiuj klucz teraz — nie pokażemy go ponownie.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-card px-3 py-2 font-mono text-sm">
              {freshKey}
            </code>
            <Button variant="secondary" size="sm" onClick={copyKey}>
              Kopiuj
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Wczytywanie…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze żadnego klucza.
          </p>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div className="min-w-0">
                <code className="font-mono text-sm">{k.key_prefix}…</code>
                <p className="mt-1 text-xs text-muted-foreground">
                  Utworzono {formatDate(k.created_at.slice(0, 10))}
                  {k.last_used_at
                    ? ` · ostatnio użyty ${formatDate(k.last_used_at.slice(0, 10))}`
                    : " · nieużywany"}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevoke(k.id)}
              >
                Odwołaj
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
