import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";

import { EVENT_TYPES } from "@/lib/events";
import { MOODS } from "@/lib/moods";
import { verifyApiKeyToken, userIdFromExtra } from "@/lib/api/mcp-auth";
import {
  createEntryForUser,
  getEntriesByDate,
  todayWarsaw,
} from "@/lib/api/entries-service";
import { askExpert } from "@/lib/api/expert-service";

export const runtime = "nodejs";
export const maxDuration = 60;

const EVENT_VALUES = EVENT_TYPES.map((t) => t.value) as [string, ...string[]];
const MOOD_HINT = MOODS.map((m) => `${m.value}=${m.label}`).join(", ");
const EVENT_HINT = EVENT_TYPES.map((t) => `${t.value} (${t.label})`).join(", ");

// Zwraca treść narzędzia jako pojedynczy blok tekstowy z JSON-em
// (agenci najłatwiej parsują ustrukturyzowany JSON).
function jsonContent(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorContent(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

const handler = createMcpHandler(
  (server) => {
    // ── dodaj_wpis ───────────────────────────────────────────────────────────
    server.registerTool(
      "dodaj_wpis",
      {
        title: "Dodaj wpis do dziennika",
        description:
          "Dodaje nowy wpis do dziennika Pauza w imieniu właściciela klucza API. " +
          "Domyślnie na dzisiejszy dzień (strefa Europe/Warsaw). Wymagany jest tylko 'text'.",
        inputSchema: {
          text: z
            .string()
            .describe("Treść wpisu (zwykły tekst; podwójna nowa linia rozdziela akapity)."),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Data wpisu w formacie yyyy-MM-dd. Domyślnie dziś."),
          mood: z
            .number()
            .int()
            .min(1)
            .max(5)
            .optional()
            .describe(`Nastrój 1–5: ${MOOD_HINT}.`),
          title: z.string().optional().describe("Opcjonalny tytuł wpisu."),
          event: z
            .object({
              types: z
                .array(z.enum(EVENT_VALUES))
                .optional()
                .describe(`Typy zdarzeń. Dozwolone: ${EVENT_HINT}.`),
              note: z.string().optional().describe("Opis zdarzenia."),
              favorite: z.boolean().optional().describe("Czy wyróżnić zdarzenie (serduszko)."),
            })
            .optional()
            .describe("Opcjonalne zdarzenie powiązane z wpisem."),
        },
      },
      async (args, extra) => {
        const userId = userIdFromExtra(extra);
        if (!userId) return errorContent("Brak autoryzacji.");

        const res = await createEntryForUser(userId, args);
        if (!res.ok) return errorContent(res.error);
        return jsonContent({ entry: res.data });
      },
    );

    // ── pobierz_wpisy ──────────────────────────────────────────────────────────
    server.registerTool(
      "pobierz_wpisy",
      {
        title: "Pobierz wpisy z dnia",
        description:
          "Zwraca wszystkie wpisy z dziennika z podanego dnia (dzień może mieć ich kilka). " +
          "Domyślnie dziś (strefa Europe/Warsaw).",
        inputSchema: {
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Data w formacie yyyy-MM-dd. Domyślnie dziś."),
        },
      },
      async (args, extra) => {
        const userId = userIdFromExtra(extra);
        if (!userId) return errorContent("Brak autoryzacji.");

        const res = await getEntriesByDate(userId, args.date ?? todayWarsaw());
        if (!res.ok) return errorContent(res.error);
        return jsonContent(res.data);
      },
    );

    // ── zapytaj_eksperta ───────────────────────────────────────────────────────
    server.registerTool(
      "zapytaj_eksperta",
      {
        title: "Zapytaj Eksperta (CBT)",
        description:
          "Zadaje pytanie Ekspertowi — asystentowi w nurcie terapii poznawczo-behawioralnej (CBT). " +
          "Bez 'date' analizuje cały dziennik. Z 'date' rozmowa dotyczy tylko tego dnia, a wątek " +
          "jest zapamiętywany (kolejne pytania kontynuują rozmowę). Obowiązuje dzienny limit zapytań.",
        inputSchema: {
          message: z.string().describe("Pytanie do Eksperta."),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Opcjonalna data (yyyy-MM-dd) ustawiająca kontekst na jeden dzień."),
        },
      },
      async (args, extra) => {
        const userId = userIdFromExtra(extra);
        if (!userId) return errorContent("Brak autoryzacji.");

        const res = await askExpert(userId, args.message, args.date ?? null);
        if (!res.ok) return errorContent(res.error);
        return jsonContent({ reply: res.reply });
      },
    );
  },
  {
    serverInfo: { name: "pauza", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    // SSE wymaga Redisa; wystawiamy tylko streamable HTTP (/api/mcp).
    disableSse: true,
  },
);

// Uwierzytelnianie kluczem API (Bearer). required: brak/zły klucz → 401.
const authedHandler = withMcpAuth(handler, verifyApiKeyToken, { required: true });

export { authedHandler as GET, authedHandler as POST };
