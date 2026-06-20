import type { Metadata } from "next";

import { MOODS } from "@/lib/moods";
import { EVENT_TYPES } from "@/lib/events";
import { Code, Pill, Section } from "@/components/docs-ui";

export const metadata: Metadata = {
  title: "Pauza — serwer MCP",
  description:
    "Serwer MCP Pauzy: podłącz agenta AI (Claude, Cursor) jednym endpointem i steruj dziennikiem narzędziami dodaj_wpis, pobierz_wpisy, zapytaj_eksperta.",
};

// Publiczny URL serwera MCP (produkcja). Podmień przy własnej instalacji.
const MCP_URL = "https://pauza-journal.vercel.app/api/mcp";

export default function DocsMcpPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-40 sm:pt-12">
      <header>
        <h1 className="font-heading text-4xl font-medium tracking-tight">Serwer MCP</h1>
        <p className="mt-2 text-base text-muted-foreground">
          MCP (Model Context Protocol) to standard, który pozwala agentom AI łączyć się z
          Twoją Pauzą i korzystać z niej za pomocą gotowych narzędzi — bez ręcznego
          składania zapytań HTTP. To najprostszy sposób, by agent dodawał wpisy, czytał je
          i rozmawiał z Ekspertem.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Serwer używa <strong>tego samego klucza API</strong> co REST (zakładka{" "}
          <strong>API</strong>). Wygeneruj klucz w panelu „Klucze API&quot; u góry strony.
        </p>
      </header>

      {/* Spis treści */}
      <nav className="mt-8 rounded-xl border bg-card p-4 text-sm">
        <p className="font-medium">Spis treści</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
          <li>
            <a href="#endpoint" className="underline-offset-4 hover:underline">
              1. Adres serwera i transport
            </a>
          </li>
          <li>
            <a href="#auth" className="underline-offset-4 hover:underline">
              2. Uwierzytelnianie
            </a>
          </li>
          <li>
            <a href="#podlaczenie" className="underline-offset-4 hover:underline">
              3. Podłączenie klienta (Claude, Cursor)
            </a>
          </li>
          <li>
            <a href="#narzedzia" className="underline-offset-4 hover:underline">
              4. Narzędzia
            </a>
          </li>
          <li>
            <a href="#slowniki" className="underline-offset-4 hover:underline">
              5. Słowniki (nastrój, typy zdarzeń)
            </a>
          </li>
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-12">
        <Section id="endpoint" title="1. Adres serwera i transport">
          <p>
            Serwer MCP jest dostępny pod jednym adresem, transport{" "}
            <strong>streamable HTTP</strong> (zalecany przez specyfikację MCP, wspierany
            m.in. przez Claude i Cursor):
          </p>
          <Code>{MCP_URL}</Code>
          <p className="text-muted-foreground">
            Przy własnej instalacji adresem jest <code className="font-mono">/api/mcp</code>{" "}
            na originie Twojej Pauzy.
          </p>
        </Section>

        <Section id="auth" title="2. Uwierzytelnianie">
          <p>
            Połączenie autoryzujesz <strong>kluczem API</strong> w nagłówku{" "}
            <Pill>Authorization: Bearer …</Pill> — tym samym, którego używa REST. Bez
            ważnego klucza serwer zwraca <Pill>401</Pill>. Każde narzędzie działa w imieniu
            właściciela klucza (widzi i zmienia tylko jego dane).
          </p>
          <Code>{`Authorization: Bearer pauza_sk_twoj_klucz`}</Code>
        </Section>

        <Section id="podlaczenie" title="3. Podłączenie klienta">
          <p>
            <strong>Claude Code (CLI)</strong> — dodaj serwer jednym poleceniem:
          </p>
          <Code>{`claude mcp add --transport http pauza ${MCP_URL} \\
  --header "Authorization: Bearer pauza_sk_twoj_klucz"`}</Code>

          <p>
            <strong>Cursor</strong> oraz inne klienty z plikiem konfiguracyjnym (np.{" "}
            <code className="font-mono">.cursor/mcp.json</code>) — dodaj wpis z adresem i
            nagłówkiem:
          </p>
          <Code>{`{
  "mcpServers": {
    "pauza": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer pauza_sk_twoj_klucz"
      }
    }
  }
}`}</Code>

          <p>
            <strong>Klienty obsługujące tylko stdio</strong> (np. starsze konfiguracje
            Claude Desktop) — użyj mostka <code className="font-mono">mcp-remote</code>:
          </p>
          <Code>{`{
  "mcpServers": {
    "pauza": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${MCP_URL}",
        "--header",
        "Authorization: Bearer pauza_sk_twoj_klucz"
      ]
    }
  }
}`}</Code>
          <p className="text-muted-foreground">
            Po podłączeniu klient zobaczy trzy narzędzia opisane niżej. Traktuj klucz jak
            hasło — nie umieszczaj go w repozytoriach publicznych.
          </p>
        </Section>

        <Section id="narzedzia" title="4. Narzędzia">
          <p>Serwer wystawia trzy narzędzia (odpowiedniki endpointów REST):</p>

          <h3 className="font-heading text-lg font-medium">
            <code className="font-mono">dodaj_wpis</code>
          </h3>
          <p>
            Dodaje nowy wpis do dziennika. Domyślnie na dziś (strefa Europe/Warsaw).
            Parametry:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              <code className="font-mono">text</code> <strong>(wymagane)</strong> — treść
              wpisu.
            </li>
            <li>
              <code className="font-mono">date</code> — data (
              <code className="font-mono">yyyy-MM-dd</code>), domyślnie dziś.
            </li>
            <li>
              <code className="font-mono">mood</code> — nastrój 1–5 (patrz słowniki).
            </li>
            <li>
              <code className="font-mono">title</code> — opcjonalny tytuł.
            </li>
            <li>
              <code className="font-mono">event</code> —{" "}
              <code className="font-mono">{`{ types, note, favorite }`}</code> (typy z listy,
              opis, wyróżnienie).
            </li>
          </ul>

          <h3 className="mt-2 font-heading text-lg font-medium">
            <code className="font-mono">pobierz_wpisy</code>
          </h3>
          <p>Zwraca wszystkie wpisy z danego dnia. Parametry:</p>
          <ul className="ml-5 list-disc">
            <li>
              <code className="font-mono">date</code> — data (
              <code className="font-mono">yyyy-MM-dd</code>), domyślnie dziś.
            </li>
          </ul>

          <h3 className="mt-2 font-heading text-lg font-medium">
            <code className="font-mono">zapytaj_eksperta</code>
          </h3>
          <p>
            Zadaje pytanie Ekspertowi (asystent CBT). Bez <code className="font-mono">date</code>{" "}
            analizuje cały dziennik; z datą skupia się na jednym dniu i pamięta wątek.
            Obowiązuje dzienny limit zapytań. Parametry:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              <code className="font-mono">message</code> <strong>(wymagane)</strong> —
              pytanie.
            </li>
            <li>
              <code className="font-mono">date</code> — opcjonalna data ustawiająca kontekst
              na jeden dzień.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Każde narzędzie zwraca wynik jako JSON (np.{" "}
            <code className="font-mono">{`{ "entry": … }`}</code>,{" "}
            <code className="font-mono">{`{ "entries": [...] }`}</code>,{" "}
            <code className="font-mono">{`{ "reply": "…" }`}</code>). W razie błędu wynik ma
            pole <code className="font-mono">error</code> i jest oznaczony jako błąd.
          </p>
        </Section>

        <Section id="slowniki" title="5. Słowniki">
          <p>
            <strong>Nastrój</strong> (<code className="font-mono">mood</code>) — liczba 1–5:
          </p>
          <ul className="ml-5 list-disc">
            {MOODS.map((m) => (
              <li key={m.value}>
                <code className="font-mono">{m.value}</code> — {m.emoji} {m.label}
              </li>
            ))}
          </ul>
          <p>
            <strong>Typy zdarzeń</strong> (<code className="font-mono">event.types</code>) —
            dozwolone wartości:
          </p>
          <ul className="ml-5 grid grid-cols-2 gap-x-6 list-disc sm:grid-cols-3">
            {EVENT_TYPES.map((t) => (
              <li key={t.value}>
                <code className="font-mono">{t.value}</code> — {t.label}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
