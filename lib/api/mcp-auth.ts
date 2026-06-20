import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api/keys";

// verifyToken dla withMcpAuth — uwierzytelnia klientów MCP tym samym kluczem API
// (pauza_sk_…) co publiczne REST. Ta sama ścieżka co lib/api/auth.resolveApiUser:
// hash SHA-256 → wyszukanie nieodwołanego klucza service-rolem (api_keys jest pod RLS,
// a tu nie ma sesji). Zwraca AuthInfo (clientId/extra = userId) albo undefined → 401.
export async function verifyApiKeyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    // Brak konfiguracji (SUPABASE_SECRET_KEY) — bez tego nie zweryfikujemy klucza.
    console.error("[mcp-auth] błąd konfiguracji:", e);
    return undefined;
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hashApiKey(bearerToken.trim()))
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return undefined;

  // Best-effort: znacznik ostatniego użycia (nie blokuje odpowiedzi).
  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  const userId = data.user_id as string;
  return {
    token: bearerToken,
    clientId: userId,
    scopes: [],
    extra: { userId },
  };
}

// Pomocnik: wyciąga userId z extra przekazanego do handlera narzędzia MCP.
export function userIdFromExtra(extra: { authInfo?: AuthInfo }): string | null {
  const fromExtra = extra.authInfo?.extra?.userId;
  if (typeof fromExtra === "string") return fromExtra;
  const fromClient = extra.authInfo?.clientId;
  return typeof fromClient === "string" ? fromClient : null;
}
