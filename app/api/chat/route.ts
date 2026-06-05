import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { createClient } from "@/lib/supabase/server";
import { buildExpertSystemPrompt, type ChatMode } from "@/lib/ai/expert-prompt";

// Zwykłe wywołanie HTTP do Anthropic — działa na Vercel serverless.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;

const anthropic = new Anthropic(); // czyta ANTHROPIC_API_KEY z env

type Role = "user" | "assistant";
interface HistoryMsg {
  role: Role;
  content: string;
}

// Usuwa HTML z treści wpisu (Tiptap) → czysty tekst dla modelu.
function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MOOD_LABEL: Record<number, string> = {
  1: "bardzo źle",
  2: "źle",
  3: "neutralnie",
  4: "dobrze",
  5: "bardzo dobrze",
};

interface EntryRow {
  date: string;
  mood: number | null;
  title: string | null;
  content: string;
}

function formatEntries(rows: EntryRow[]): string {
  if (rows.length === 0) return "Brak wpisów.";
  return rows
    .map((e) => {
      const mood =
        e.mood != null
          ? `nastrój: ${e.mood}/5 (${MOOD_LABEL[e.mood] ?? "?"})`
          : "nastrój: brak";
      const title = e.title ? `\nTytuł: ${e.title}` : "";
      return `# ${e.date} — ${mood}${title}\n${stripHtml(e.content)}`;
    })
    .join("\n\n---\n\n");
}

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
    .select("date, mood, title, content")
    .order("date", { ascending: true });
  if (mode === "dzien" && date) entriesQuery = entriesQuery.eq("date", date);
  const { data: entryRows } = await entriesQuery;
  const entriesText = formatEntries((entryRows ?? []) as EntryRow[]);

  // 5. Wywołanie modelu (Messages API)
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: buildExpertSystemPrompt(mode),
          cache_control: { type: "ephemeral" }, // stabilny prefiks — cache persony
        },
        {
          type: "text",
          text: `Wpisy z dziennika:\n\n${entriesText}`,
        },
      ],
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

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
