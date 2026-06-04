import { createBrowserClient } from "@supabase/ssr";

// Klient Supabase do komponentów client (cała apka to "use client").
// Sesja trzymana w cookies przez @supabase/ssr.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
