import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Serwerowy klient Supabase do Route Handlerów (np. /api/chat).
// Czyta sesję z cookies, więc zapytania lecą w kontekście zalogowanej
// użytkowniczki — RLS pilnuje, że widzi tylko swoje dane.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll wywołane z kontekstu, który nie pozwala pisać cookies
            // (np. Server Component) — sesję odświeża wtedy proxy.ts.
          }
        },
      },
    },
  );
}
