import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/ai/expert-context";
import { embedText } from "@/lib/ai/embeddings";

// Liczy i zapisuje embedding dla wpisu zalogowanego użytkownika.
// Wołane best-effort z UI po utworzeniu/edycji wpisu (klucz OpenAI tylko serwerowo).
// RLS: select/update przechodzą pod sesją usera — można dotknąć wyłącznie własnych wpisów.
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // Brak klucza → cicho pomijamy (wpis i tak zapisany; backfill uzupełni później).
    return NextResponse.json({ ok: false, skipped: "no_openai_key" });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }
  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Pole 'id' jest wymagane." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nie zalogowano." }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("entries")
    .select("id, title, content")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "Wpis nie znaleziony." }, { status: 404 });
  }

  try {
    const text =
      ((row.title ?? "").trim() ? row.title.trim() + "\n" : "") +
      stripHtml(row.content ?? "");
    const embedding = await embedText(text || "(pusty wpis)");
    const { error: upErr } = await supabase
      .from("entries")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", id);
    if (upErr) throw upErr;
  } catch (e) {
    console.error("[/api/entries/embed] błąd embeddingu:", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
