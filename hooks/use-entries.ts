"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entry } from "@/lib/types";
import * as storage from "@/lib/storage";

// Lista wpisów z Supabase. Czyta po zamontowaniu.
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setEntries(await storage.getEntries());
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await storage.getEntries();
        if (active) setEntries(data);
      } catch {
        if (active) setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { entries, loading, refresh };
}

// Pojedynczy wpis po id.
export function useEntry(id: string) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await storage.getEntry(id);
        if (active) setEntry(data);
      } catch {
        if (active) setEntry(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return { entry, loading };
}
