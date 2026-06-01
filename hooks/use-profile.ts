"use client";

import { useCallback, useEffect, useState } from "react";
import * as storage from "@/lib/storage";

// Imię użytkowniczki z localStorage. Czyta po zamontowaniu (unika rozjazdu
// SSR/hydratacji) i odświeża się przy zmianach w innej karcie.
export function useProfile() {
  const [name, setNameState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNameState(storage.getName());
    setLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === storage.PROFILE_KEY) {
        setNameState(storage.getName());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setName = useCallback((value: string) => {
    storage.setName(value);
    setNameState(value);
  }, []);

  return { name, loading, setName };
}
