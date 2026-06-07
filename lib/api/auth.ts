import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api/keys";

// Tożsamość wywołującego publiczne API ustalana z klucza API (nie z sesji cookie).
export interface ApiUser {
  userId: string;
}

// Odczyt klucza z nagłówka: "Authorization: Bearer <klucz>" lub "X-API-Key: <klucz>".
function readApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();
  return null;
}

// Zwraca { userId } dla ważnego, nieodwołanego klucza albo null.
// Uwierzytelnianie idzie service-rolem (api_keys jest pod RLS, a tu nie ma sesji).
// Może rzucić, gdy brak konfiguracji (SUPABASE_SERVICE_ROLE_KEY) — obsłuż to przez authenticate().
export async function resolveApiUser(request: Request): Promise<ApiUser | null> {
  const plaintext = readApiKey(request);
  if (!plaintext) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hashApiKey(plaintext))
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  // Best-effort: znacznik ostatniego użycia (nie blokuje odpowiedzi).
  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id as string };
}

// Ujednolicona odpowiedź 401 dla braku/niepoprawnego klucza.
export function unauthorized() {
  return NextResponse.json(
    { error: "Nieprawidłowy lub brakujący klucz API." },
    { status: 401 },
  );
}

// Wynik uwierzytelnienia: albo użytkownik, albo gotowa odpowiedź błędu do zwrócenia.
export type AuthResult =
  | { ok: true; user: ApiUser }
  | { ok: false; response: NextResponse };

// Wygodny strażnik dla route'ów /api/v1: zwraca usera lub gotową odpowiedź
// (401 dla braku/złego klucza, 500 dla błędnej konfiguracji serwera).
export async function authenticate(request: Request): Promise<AuthResult> {
  try {
    const user = await resolveApiUser(request);
    if (!user) return { ok: false, response: unauthorized() };
    return { ok: true, user };
  } catch (e) {
    console.error("[api/auth] błąd uwierzytelniania:", e);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Serwer nie jest poprawnie skonfigurowany (brak klucza Supabase secret)." },
        { status: 500 },
      ),
    };
  }
}
