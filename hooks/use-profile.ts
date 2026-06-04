"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Imię użytkowniczki z konta (Google OAuth). Bierze pierwszą część z
// user_metadata, a w razie braku — fragment przed @ z adresu e-mail.
function deriveName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const full =
    (metadata?.full_name as string | undefined) ??
    (metadata?.name as string | undefined) ??
    "";
  if (full) return full.split(" ")[0];
  if (email) return email.split("@")[0];
  return "";
}

export function useProfile() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setName(deriveName(user?.user_metadata, user?.email));
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setName(
        deriveName(session?.user?.user_metadata, session?.user?.email),
      );
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { name, loading };
}
