import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES } from "@/lib/events";
import { stripHtml } from "@/lib/ai/expert-context";
import { embedText } from "@/lib/ai/embeddings";

export const runtime = "nodejs";

// Pełny wiersz public.entries (snake_case).
interface EntryRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  mood: number | null;
  event_types: string[] | null;
  event_note: string | null;
  event_favorite: boolean | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

// Wpis w odpowiedzi API (camelCase, spójny z lib/types.ts Entry).
function rowToEntry(row: EntryRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    mood: row.mood ?? null,
    eventTypes: row.event_types ?? [],
    eventNote: row.event_note ?? "",
    eventFavorite: row.event_favorite ?? false,
    photoPath: row.photo_path ?? null,
    photoUrl: null, // zdjęcia poza zakresem API v1
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_EVENT_TYPES = new Set<string>(EVENT_TYPES.map((t) => t.value));

// Dzisiejsza data (yyyy-MM-dd) w strefie Europe/Warsaw — niezależnie od TZ serwera.
function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Czysty tekst → HTML zgodny z edytorem (Tiptap): akapity rozdzielone pustą linią,
// pojedyncze przejścia do nowej linii jako <br>.
function textToHtml(text: string): string {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (paragraphs.length === 0) return "";
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// ── POST /api/v1/entries — dodanie wpisu na dany dzień ───────────────────────
export async function POST(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;
  const auth = result.user;

  let body: {
    text?: string;
    date?: string;
    mood?: number;
    title?: string;
    event?: { types?: string[]; note?: string; favorite?: boolean };
  };
  try {
    body = await request.json();
  } catch {
    return badRequest("Nieprawidłowe żądanie (oczekiwano JSON).");
  }

  const text = (body.text ?? "").trim();
  if (!text) return badRequest("Pole 'text' jest wymagane.");

  const date = body.date ?? todayWarsaw();
  if (!DATE_RE.test(date)) {
    return badRequest("Pole 'date' musi mieć format yyyy-MM-dd.");
  }

  let mood: number | null = null;
  if (body.mood != null) {
    if (!Number.isInteger(body.mood) || body.mood < 1 || body.mood > 5) {
      return badRequest("Pole 'mood' musi być liczbą całkowitą 1–5.");
    }
    mood = body.mood;
  }

  const event = body.event ?? {};
  const eventTypes = Array.isArray(event.types) ? event.types : [];
  for (const t of eventTypes) {
    if (!ALLOWED_EVENT_TYPES.has(t)) {
      return badRequest(
        `Nieznany typ zdarzenia '${t}'. Dozwolone: ${[...ALLOWED_EVENT_TYPES].join(", ")}.`,
      );
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: auth.userId,
      title: (body.title ?? "").trim(),
      content: textToHtml(text),
      date,
      mood,
      event_types: eventTypes,
      event_note: (event.note ?? "").trim(),
      event_favorite: event.favorite === true,
      photo_path: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[POST /api/v1/entries] błąd zapisu:", error);
    return NextResponse.json({ error: "Nie udało się zapisać wpisu." }, { status: 500 });
  }

  // Embedding (best-effort): błąd nie blokuje zapisu — backfill uzupełni później.
  if (process.env.OPENAI_API_KEY) {
    try {
      const row = data as EntryRow;
      const embedInput =
        (row.title?.trim() ? row.title.trim() + "\n" : "") + stripHtml(row.content);
      const embedding = await embedText(embedInput || "(pusty wpis)");
      await supabase
        .from("entries")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", row.id)
        .eq("user_id", auth.userId);
    } catch (e) {
      console.error("[POST /api/v1/entries] embedding pominięty:", e);
    }
  }

  return NextResponse.json({ entry: rowToEntry(data as EntryRow) }, { status: 201 });
}

// ── GET /api/v1/entries?date=yyyy-MM-dd — wpisy z danego dnia ─────────────────
export async function GET(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;
  const auth = result.user;

  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? todayWarsaw();
  if (!DATE_RE.test(date)) {
    return badRequest("Parametr 'date' musi mieć format yyyy-MM-dd.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/v1/entries] błąd odczytu:", error);
    return NextResponse.json({ error: "Nie udało się pobrać wpisów." }, { status: 500 });
  }

  const entries = (data as EntryRow[]).map(rowToEntry);
  return NextResponse.json({ date, entries });
}
