import { createClient } from "@supabase/supabase-js";

// Klient service-role: OMIJA RLS. Używany WYŁĄCZNIE po stronie serwera w publicznym
// API (/api/v1/*) oraz przy weryfikacji kluczy API — tam, gdzie nie ma sesji Supabase,
// więc auth.uid() jest nullem i RLS by zablokowało zapytania.
//
// ⚠️ Każde zapytanie tym klientem MUSI ręcznie zawężać po user_id (.eq("user_id", ...)),
// bo nie ma żadnej automatycznej izolacji danych.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Nowy system kluczy Supabase: "secret key" (sb_secret_…) zastępuje legacy service_role.
  // Fallback na starą nazwę zmiennej dla zgodności.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY w środowisku.",
    );
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
