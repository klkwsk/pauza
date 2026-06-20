import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatMode } from "@/lib/ai/expert-prompt";
import { formatEntries, type EntryRow } from "@/lib/ai/expert-context";
import { retrieveRelevantEntriesText } from "@/lib/ai/retrieval";
import { generateExpertReply, type HistoryMsg } from "@/lib/ai/expert-engine";

import { DATE_RE } from "@/lib/api/entries-service";

// Warstwa serwisowa Eksperta — współdzielona przez REST /api/v1/expert oraz MCP.
// Bez 'date' → tryb "wszystkie" (RAG po całym dzienniku). Z 'date' → tryb "dzien"
// (kontekst i trwała historia rozmowy przypięte do dnia). Operuje service-rolem,
// więc ręcznie zawęża po user_id.

export type AskExpertResult =
  | { ok: true; reply: string }
  | { ok: false; code: "validation" | "rate_limit" | "model" | "server"; error: string };

export async function askExpert(
  userId: string,
  message: string,
  date: string | null,
): Promise<AskExpertResult> {
  const trimmed = (message ?? "").trim();
  if (!trimmed) {
    return { ok: false, code: "validation", error: "Pole 'message' jest wymagane." };
  }
  if (date != null && !DATE_RE.test(date)) {
    return { ok: false, code: "validation", error: "Pole 'date' musi mieć format yyyy-MM-dd." };
  }

  const supabase = createAdminClient();

  // Rate limiting per użytkownik (wariant z jawnym user_id — brak sesji przy kluczu API).
  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_and_increment_ai_usage_for",
    { p_user_id: userId },
  );
  if (rlError) {
    console.error("[expert-service.askExpert] błąd limitu:", rlError);
    return { ok: false, code: "server", error: "Błąd limitu zapytań." };
  }
  if (!allowed) {
    return {
      ok: false,
      code: "rate_limit",
      error: "Dzienny limit rozmów z Ekspertem został wyczerpany. Wróć jutro.",
    };
  }

  const mode: ChatMode = date ? "dzien" : "wszystkie";

  // Historia: w trybie dziennym z bazy (zawężona user_id + date); w ogólnym bezstanowo.
  let history: HistoryMsg[] = [];
  if (mode === "dzien" && date) {
    const { data: rows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    history = (rows ?? []) as HistoryMsg[];
  }

  // Wpisy wg trybu (zawężone user_id + ew. date).
  let entriesText: string;
  if (mode === "dzien" && date) {
    const { data: entryRows } = await supabase
      .from("entries")
      .select("date, mood, title, content, event_types, event_note")
      .eq("user_id", userId)
      .eq("date", date)
      .order("date", { ascending: true });
    entriesText = formatEntries((entryRows ?? []) as EntryRow[]);
  } else {
    // Tryb ogólny: wyszukiwanie hybrydowe; fallback do ostatnich 30 wpisów.
    const retrieved = await retrieveRelevantEntriesText(supabase, userId, trimmed);
    if (retrieved) {
      entriesText = retrieved;
    } else {
      const { data: entryRows } = await supabase
        .from("entries")
        .select("date, mood, title, content, event_types, event_note")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(30);
      entriesText = formatEntries(((entryRows ?? []) as EntryRow[]).slice().reverse());
    }
  }

  try {
    const reply = await generateExpertReply({ entriesText, history, message: trimmed, mode });
    if (!reply) {
      return {
        ok: false,
        code: "model",
        error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę.",
      };
    }

    // Zapis rozmowy (tylko tryb dzienny — spójnie z UI /api/chat).
    if (mode === "dzien" && date) {
      await supabase.from("chat_messages").insert([
        { user_id: userId, date, role: "user", content: trimmed },
        { user_id: userId, date, role: "assistant", content: reply },
      ]);
    }

    return { ok: true, reply };
  } catch (e) {
    console.error("[expert-service.askExpert] błąd modelu:", e);
    return {
      ok: false,
      code: "model",
      error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę.",
    };
  }
}
