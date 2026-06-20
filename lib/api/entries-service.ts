import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES } from "@/lib/events";
import { stripHtml } from "@/lib/ai/expert-context";
import { embedText } from "@/lib/ai/embeddings";

// Warstwa serwisowa wpisów — współdzielona przez publiczne REST /api/v1/entries
// oraz serwer MCP. Operuje service-rolem (brak sesji), więc KAŻDE zapytanie
// ręcznie zawęża po user_id. Zwraca zwykłe obiekty/Result (nie NextResponse),
// żeby dało się jej użyć w obu transportach.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_EVENT_TYPES = new Set<string>(EVENT_TYPES.map((t) => t.value));

// Pełny wiersz public.entries (snake_case).
export interface EntryRow {
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

// Wpis w odpowiedzi (camelCase, spójny z lib/types.ts Entry).
export interface ApiEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: number | null;
  eventTypes: string[];
  eventNote: string;
  eventFavorite: boolean;
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  text?: string;
  date?: string;
  mood?: number;
  title?: string;
  event?: { types?: string[]; note?: string; favorite?: boolean };
}

// Wynik serwisu: sukces z danymi albo błąd walidacji/serwera z komunikatem i „kodem".
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "validation" | "server"; error: string };

export function rowToEntry(row: EntryRow): ApiEntry {
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
    photoUrl: null, // zdjęcia poza zakresem API/MCP
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Dzisiejsza data (yyyy-MM-dd) w strefie Europe/Warsaw — niezależnie od TZ serwera.
export function todayWarsaw(): string {
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
export function textToHtml(text: string): string {
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

// ── Dodanie wpisu na dany dzień ──────────────────────────────────────────────
export async function createEntryForUser(
  userId: string,
  input: CreateEntryInput,
): Promise<ServiceResult<ApiEntry>> {
  const text = (input.text ?? "").trim();
  if (!text) return { ok: false, code: "validation", error: "Pole 'text' jest wymagane." };

  const date = input.date ?? todayWarsaw();
  if (!DATE_RE.test(date)) {
    return { ok: false, code: "validation", error: "Pole 'date' musi mieć format yyyy-MM-dd." };
  }

  let mood: number | null = null;
  if (input.mood != null) {
    if (!Number.isInteger(input.mood) || input.mood < 1 || input.mood > 5) {
      return { ok: false, code: "validation", error: "Pole 'mood' musi być liczbą całkowitą 1–5." };
    }
    mood = input.mood;
  }

  const event = input.event ?? {};
  const eventTypes = Array.isArray(event.types) ? event.types : [];
  for (const t of eventTypes) {
    if (!ALLOWED_EVENT_TYPES.has(t)) {
      return {
        ok: false,
        code: "validation",
        error: `Nieznany typ zdarzenia '${t}'. Dozwolone: ${[...ALLOWED_EVENT_TYPES].join(", ")}.`,
      };
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: userId,
      title: (input.title ?? "").trim(),
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
    console.error("[entries-service.createEntryForUser] błąd zapisu:", error);
    return { ok: false, code: "server", error: "Nie udało się zapisać wpisu." };
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
        .eq("user_id", userId);
    } catch (e) {
      console.error("[entries-service.createEntryForUser] embedding pominięty:", e);
    }
  }

  return { ok: true, data: rowToEntry(data as EntryRow) };
}

// ── Wpisy z danego dnia ──────────────────────────────────────────────────────
export async function getEntriesByDate(
  userId: string,
  date: string,
): Promise<ServiceResult<{ date: string; entries: ApiEntry[] }>> {
  if (!DATE_RE.test(date)) {
    return { ok: false, code: "validation", error: "Parametr 'date' musi mieć format yyyy-MM-dd." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[entries-service.getEntriesByDate] błąd odczytu:", error);
    return { ok: false, code: "server", error: "Nie udało się pobrać wpisów." };
  }

  return { ok: true, data: { date, entries: (data as EntryRow[]).map(rowToEntry) } };
}
