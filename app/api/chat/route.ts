import { NextResponse } from "next/server";
import { z } from "zod";
import {
  query,
  tool,
  createSdkMcpServer,
} from "@anthropic-ai/claude-agent-sdk";

import { createClient } from "@/lib/supabase/server";
import { buildFreudSystemPrompt, type ChatMode } from "@/lib/ai/freud-prompt";

// Agent SDK uruchamia podproces CLI — wymaga środowiska Node, nie Edge.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5-20251001";

// Czyste env dla podprocesu Agent SDK: wymusza autoryzację przez ANTHROPIC_API_KEY,
// usuwając zmienne, które mogłyby przekierować na logowanie OAuth / inny endpoint.
// Na zwykłej maszynie tych zmiennych nie ma — wtedy to po prostu kopia process.env.
function agentEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v !== "string") continue;
    if (
      k === "ANTHROPIC_AUTH_TOKEN" ||
      k === "ANTHROPIC_BASE_URL" ||
      k === "ANTHROPIC_CUSTOM_HEADERS" ||
      k === "CLAUDECODE" ||
      k.startsWith("CLAUDE_CODE_")
    ) {
      continue;
    }
    env[k] = v;
  }
  return env;
}

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
        e.mood != null ? `nastrój: ${e.mood}/5 (${MOOD_LABEL[e.mood] ?? "?"})` : "nastrój: brak";
      const title = e.title ? `\nTytuł: ${e.title}` : "";
      return `# ${e.date} — ${mood}${title}\n${stripHtml(e.content)}`;
    })
    .join("\n\n---\n\n");
}

// Buduje prompt z dotychczasową rozmową (multi-turn przez replay — PRD §6.4).
function buildPrompt(history: HistoryMsg[], message: string): string {
  if (history.length === 0) return message;
  const transcript = history
    .map((m) => `${m.role === "user" ? "Użytkowniczka" : "Freud"}: ${m.content}`)
    .join("\n");
  return `Dotychczasowa rozmowa:\n${transcript}\n\nNowa wiadomość użytkowniczki:\n${message}`;
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
      { error: "Dzienny limit rozmów z Freudem został wyczerpany. Wróć jutro." },
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

  // 4. Narzędzie agenta: zwraca wpisy istotne dla bieżącego trybu (scope ustalony serwerowo).
  const entriesTool = tool(
    "pobierz_wpisy",
    mode === "dzien"
      ? "Zwraca wpis(y) z dziennika z aktualnie wybranego dnia."
      : "Zwraca wszystkie wpisy z dziennika użytkowniczki.",
    {},
    async () => {
      let q = supabase
        .from("entries")
        .select("date, mood, title, content")
        .order("date", { ascending: true });
      if (mode === "dzien" && date) q = q.eq("date", date);
      const { data, error } = await q;
      const text = error
        ? "Nie udało się pobrać wpisów."
        : formatEntries((data ?? []) as EntryRow[]);
      return { content: [{ type: "text", text }] };
    },
  );

  const mcp = createSdkMcpServer({
    name: "pauza",
    version: "1.0.0",
    tools: [entriesTool],
  });

  // 5. Wywołanie agenta
  try {
    const response = query({
      prompt: buildPrompt(history, message),
      options: {
        model: MODEL,
        systemPrompt: buildFreudSystemPrompt(mode),
        mcpServers: { pauza: mcp },
        allowedTools: ["mcp__pauza__pobierz_wpisy"],
        tools: [], // wyłącz wbudowane narzędzia (pliki, bash itp.)
        settingSources: [], // nie ładuj projektowego CLAUDE.md / ustawień
        permissionMode: "bypassPermissions",
        maxTurns: 6,
        env: agentEnv(),
      },
    });

    let reply = "";
    for await (const msg of response) {
      if (msg.type === "result") {
        if (msg.subtype === "success") {
          reply = msg.result;
        } else {
          return NextResponse.json(
            { error: "Freud chwilowo milczy — spróbuj ponownie za chwilę." },
            { status: 502 },
          );
        }
      }
    }

    reply = reply.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Freud chwilowo milczy — spróbuj ponownie za chwilę." },
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
    console.error("[/api/chat] błąd agenta:", e);
    return NextResponse.json(
      { error: "Freud chwilowo milczy — spróbuj ponownie za chwilę." },
      { status: 502 },
    );
  }
}
