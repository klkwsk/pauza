import Anthropic from "@anthropic-ai/sdk";

import { buildExpertSystemPrompt, type ChatMode } from "@/lib/ai/expert-prompt";

// Czysta warstwa „prompt + model" Eksperta — bez dostępu do bazy.
// Wywołujący sam pobiera wpisy/historię (UI: cookie+RLS, API: service-role),
// formatuje wpisy (lib/ai/expert-context) i przekazuje gotowy tekst tutaj.

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;

const anthropic = new Anthropic(); // czyta ANTHROPIC_API_KEY z env

export type Role = "user" | "assistant";
export interface HistoryMsg {
  role: Role;
  content: string;
}

export interface ExpertReplyInput {
  entriesText: string; // sformatowane wpisy (formatEntries)
  history: HistoryMsg[]; // dotychczasowa rozmowa
  message: string; // nowa wiadomość użytkownika
  mode: ChatMode; // "dzien" | "wszystkie"
}

// Zwraca odpowiedź Eksperta (tekst). Pusty string oznacza brak treści od modelu.
export async function generateExpertReply({
  entriesText,
  history,
  message,
  mode,
}: ExpertReplyInput): Promise<string> {
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

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
