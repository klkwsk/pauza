import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatMode } from "@/lib/ai/expert-prompt";
import { formatEntries, type EntryRow } from "@/lib/ai/expert-context";
import { retrieveRelevantEntriesText } from "@/lib/ai/retrieval";
import { generateExpertReply, type HistoryMsg } from "@/lib/ai/expert-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── POST /api/v1/expert — pytanie do Eksperta ────────────────────────────────
// Body: { message: string, date?: "yyyy-MM-dd" }. Bez 'date' → tryb "wszystkie".
export async function POST(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;
  const auth = result.user;

  let body: { message?: string; date?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie (oczekiwano JSON)." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Pole 'message' jest wymagane." }, { status: 400 });
  }

  const date = body.date ?? null;
  if (date != null && !DATE_RE.test(date)) {
    return NextResponse.json(
      { error: "Pole 'date' musi mieć format yyyy-MM-dd." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Rate limiting per użytkownik (wariant z jawnym user_id — brak sesji przy kluczu API).
  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_and_increment_ai_usage_for",
    { p_user_id: auth.userId },
  );
  if (rlError) {
    console.error("[POST /api/v1/expert] błąd limitu:", rlError);
    return NextResponse.json({ error: "Błąd limitu zapytań." }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Dzienny limit rozmów z Ekspertem został wyczerpany. Wróć jutro." },
      { status: 429 },
    );
  }

  const mode: ChatMode = date ? "dzien" : "wszystkie";

  // Historia: w trybie dziennym z bazy (zawężona user_id + date); w ogólnym bezstanowo.
  let history: HistoryMsg[] = [];
  if (mode === "dzien" && date) {
    const { data: rows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", auth.userId)
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
      .eq("user_id", auth.userId)
      .eq("date", date)
      .order("date", { ascending: true });
    entriesText = formatEntries((entryRows ?? []) as EntryRow[]);
  } else {
    // Tryb ogólny: wyszukiwanie hybrydowe; fallback do ostatnich 30 wpisów.
    const retrieved = await retrieveRelevantEntriesText(supabase, auth.userId, message);
    if (retrieved) {
      entriesText = retrieved;
    } else {
      const { data: entryRows } = await supabase
        .from("entries")
        .select("date, mood, title, content, event_types, event_note")
        .eq("user_id", auth.userId)
        .order("date", { ascending: false })
        .limit(30);
      entriesText = formatEntries(
        ((entryRows ?? []) as EntryRow[]).slice().reverse(),
      );
    }
  }

  try {
    const reply = await generateExpertReply({ entriesText, history, message, mode });

    if (!reply) {
      return NextResponse.json(
        { error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę." },
        { status: 502 },
      );
    }

    // Zapis rozmowy (tylko tryb dzienny — spójnie z UI /api/chat).
    if (mode === "dzien" && date) {
      await supabase.from("chat_messages").insert([
        { user_id: auth.userId, date, role: "user", content: message },
        { user_id: auth.userId, date, role: "assistant", content: reply },
      ]);
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[POST /api/v1/expert] błąd modelu:", e);
    return NextResponse.json(
      { error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę." },
      { status: 502 },
    );
  }
}
