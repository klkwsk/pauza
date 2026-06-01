"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entry } from "@/lib/types";
import * as storage from "@/lib/storage";

// Lista wpisów z localStorage. Czyta po zamontowaniu (unika rozjazdu SSR/hydratacji)
// i odświeża się przy zmianach w innej karcie.
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setEntries(storage.getEntries());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === storage.STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return { entries, loading, refresh };
}

// Pojedynczy wpis po id.
export function useEntry(id: string) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntry(storage.getEntry(id));
    setLoading(false);
  }, [id]);

  return { entry, loading };
}
