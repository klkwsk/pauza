// Budowa kontekstu wpisów dla Eksperta w trybie "wszystkie".
// Dwie warstwy, zawsze łączone:
//   1. RECENCY — ostatnie 7 dni wpisów (pełny kontekst, niezależnie od pytania),
//      żeby ogarnąć pytania typu "wczoraj pokłóciłem się z X, co o tym myślisz?".
//   2. TRAFNOŚĆ — wyszukiwanie hybrydowe (full-text + wektory, RRF w Postgresie),
//      najtrafniejsze wpisy SPOZA ostatniego tygodnia (duplikaty odfiltrowane).
//
// Zwraca null tylko, gdy NIC nie ma do pokazania (brak klucza OpenAI dotyczy wyłącznie
// warstwy hybrydowej — recency działa zawsze). Wywołujący robi wtedy fallback.

import type { SupabaseClient } from "@supabase/supabase-js";

import { embedText } from "@/lib/ai/embeddings";
import { formatEntries, type EntryRow } from "@/lib/ai/expert-context";

const MATCH_COUNT = 12;
const RECENT_DAYS = 7;

// Wiersz z id — id potrzebne do deduplikacji recency × hybrydowe.
type RowWithId = EntryRow & { id: string };

// "yyyy-MM-dd" sprzed N dni w strefie Europe/Warsaw (niezależnie od TZ serwera).
function warsawDateOffset(days: number): string {
  const now = new Date();
  const shifted = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}

export async function retrieveRelevantEntriesText(
  supabase: SupabaseClient,
  userId: string,
  message: string,
): Promise<string | null> {
  // 1. TRAFNOŚĆ — wyszukiwanie hybrydowe (best-effort; brak klucza OpenAI = brak wyników).
  let hybrid: RowWithId[] = [];
  if (process.env.OPENAI_API_KEY) {
    try {
      const embedding = await embedText(message);
      const { data, error } = await supabase.rpc("hybrid_search_entries", {
        p_user_id: userId,
        query_text: message,
        query_embedding: JSON.stringify(embedding), // pgvector przyjmuje literał tekstowy "[...]"
        match_count: MATCH_COUNT,
      });
      if (error) {
        console.error("[retrieval] błąd RPC hybrid_search_entries:", error);
      } else {
        hybrid = (data ?? []) as RowWithId[];
      }
    } catch (e) {
      console.error("[retrieval] błąd embeddingu/wyszukiwania:", e);
    }
  }

  // Brak trafień hybrydowych → null. Caller robi wtedy fallback do ostatnich 30 wpisów,
  // który i tak zawiera ostatni tydzień — nie ma sensu go tu zawężać do 7 dni.
  if (hybrid.length === 0) return null;

  // 2. RECENCY — ostatnie 7 dni doklejane ZAWSZE obok trafień, żeby ogarnąć pytania
  //    o świeże zdarzenia ("wczoraj pokłóciłem się z X"), nawet gdy nie pasują tematycznie.
  //    Zawężenie user_id jawne: bezpieczne też dla klienta service-role w /api/v1 (bez RLS).
  const since = warsawDateOffset(RECENT_DAYS - 1); // okno 7-dniowe włącznie z dziś
  const { data: recentData, error: recentErr } = await supabase
    .from("entries")
    .select("id, date, mood, title, content, event_types, event_note")
    .eq("user_id", userId)
    .gte("date", since)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (recentErr) {
    console.error("[retrieval] błąd pobierania ostatnich 7 dni:", recentErr);
  }
  const recent = (recentData ?? []) as RowWithId[];
  const recentIds = new Set(recent.map((r) => r.id));

  // Trafienia hybrydowe SPOZA ostatniego tygodnia (duplikaty odfiltrowane).
  const thematic = hybrid.filter((r) => !recentIds.has(r.id));

  // 3. Złożenie kontekstu z wyraźnie opisanymi sekcjami.
  const sections: string[] = [];
  if (recent.length > 0) {
    sections.push(
      "Ostatnie 7 dni dziennika (pełny kontekst, niezależnie od pytania):\n\n" +
        formatEntries(recent),
    );
  }
  if (thematic.length > 0) {
    sections.push(
      (recent.length > 0
        ? "Dodatkowo najtrafniejsze wpisy spoza ostatniego tygodnia, "
        : "Najtrafniejsze wpisy ") +
        "dopasowane do pytania (wyszukiwanie hybrydowe — to NIE cała historia dziennika):\n\n" +
        formatEntries(thematic),
    );
  }
  return sections.join("\n\n===\n\n");
}
