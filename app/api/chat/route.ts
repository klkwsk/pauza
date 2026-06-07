import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { ChatMode } from "@/lib/ai/expert-prompt";
import { formatEntries, type EntryRow } from "@/lib/ai/expert-context";
import {
  generateExpertReply,
  type HistoryMsg,
} from "@/lib/ai/expert-engine";

// Zwykłe wywołanie HTTP do Anthropic — działa na Vercel serverless.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { message?: string; date?: string | null; history?: HistoryMsg[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const date = body.date ?? null; // null → tryb "wszystkie"
  const clientHistory = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: "Pusta wiadomość." }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. Uwierzytelnienie
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nie zalogowano." }, { status: 401 });
  }

  // 2. Rate limiting (atomowo w bazie: limit dzienny per user + globalny)
  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_and_increment_ai_usage",
    {},
  );
  if (rlError) {
    return NextResponse.json({ error: "Błąd limitu zapytań." }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Dzienny limit rozmów z Ekspertem został wyczerpany. Wróć jutro." },
      { status: 429 },
    );
  }

  const mode: ChatMode = date ? "dzien" : "wszystkie";

  // 3. Historia rozmowy: w trybie dziennym autorytatywna z bazy, w ogólnym z klienta (ulotna)
  let history: HistoryMsg[] = clientHistory;
  if (mode === "dzien") {
    const { data: rows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("date", date)
      .order("created_at", { ascending: true });
    history = (rows ?? []) as HistoryMsg[];
  }

  // 4. Wpisy wg trybu (wstrzykiwane do system promptu)
  let entriesQuery = supabase
    .from("entries")
    .select("date, mood, title, content, event_types, event_note")
    .order("date", { ascending: true });
  if (mode === "dzien" && date) entriesQuery = entriesQuery.eq("date", date);
  const { data: entryRows } = await entriesQuery;
  const entriesText = formatEntries((entryRows ?? []) as EntryRow[]);

  // 5. Wywołanie modelu (Messages API)
  try {
    const reply = await generateExpertReply({
      entriesText,
      history,
      message,
      mode,
    });

    if (!reply) {
      return NextResponse.json(
        { error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę." },
        { status: 502 },
      );
    }

    // 6. Zapis rozmowy (tylko tryb dzienny)
    if (mode === "dzien" && date) {
      await supabase.from("chat_messages").insert([
        { user_id: user.id, date, role: "user", content: message },
        { user_id: user.id, date, role: "assistant", content: reply },
      ]);
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[/api/chat] błąd modelu:", e);
    return NextResponse.json(
      { error: "Ekspert chwilowo milczy — spróbuj ponownie za chwilę." },
      { status: 502 },
    );
  }
}
