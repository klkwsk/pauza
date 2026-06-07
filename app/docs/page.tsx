import Link from "next/link";
import type { Metadata } from "next";

import { MOODS } from "@/lib/moods";
import { EVENT_TYPES } from "@/lib/events";
import { ApiKeysManager } from "@/components/api-keys-manager";

export const metadata: Metadata = {
  title: "Pauza — dokumentacja API",
  description:
    "Publiczne API Pauzy: klucze API, dodawanie wpisów, pytania do Eksperta i odczyt wpisów z danego dnia.",
};

// Prosty blok kodu (server component — bez interakcji).
function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border bg-card p-4 font-mono text-[0.8rem] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="font-heading text-2xl font-medium tracking-tight">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-40 sm:pt-12">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            Dokumentacja
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Steruj Pauzą programowo — dla deweloperów i agentów. Każdy endpoint działa
            w imieniu użytkownika, którego kluczem API się posługujesz.
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 shrink-0 text-sm underline underline-offset-4 hover:text-foreground"
        >
          ← Pauza
        </Link>
      </header>

      {/* Spis treści */}
      <nav className="mt-8 rounded-xl border bg-card p-4 text-sm">
        <p className="font-medium">Spis treści</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
          <li>
            <a href="#klucze" className="underline-offset-4 hover:underline">
              1. Twoje klucze API
            </a>
          </li>
          <li>
            <a href="#auth" className="underline-offset-4 hover:underline">
              2. Uwierzytelnianie
            </a>
          </li>
          <li>
            <a href="#bazowy-adres" className="underline-offset-4 hover:underline">
              3. Adres bazowy, błędy i limity
            </a>
          </li>
          <li>
            <a href="#dodaj-wpis" className="underline-offset-4 hover:underline">
              4. POST /api/v1/entries — dodaj wpis
            </a>
          </li>
          <li>
            <a href="#pobierz-wpisy" className="underline-offset-4 hover:underline">
              5. GET /api/v1/entries — wpisy z dnia
            </a>
          </li>
          <li>
            <a href="#ekspert" className="underline-offset-4 hover:underline">
              6. POST /api/v1/expert — zapytaj Eksperta
            </a>
          </li>
          <li>
            <a href="#slowniki" className="underline-offset-4 hover:underline">
              7. Słowniki (nastrój, typy zdarzeń)
            </a>
          </li>
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-12">
        <Section id="klucze" title="1. Twoje klucze API">
          <p>
            API używa <strong>kluczy API per użytkownik</strong>. Wygeneruj klucz poniżej
            (musisz być zalogowana). Pełny klucz pokazujemy <strong>tylko raz</strong> —
            zapisz go bezpiecznie. Klucz działa w Twoim imieniu, więc traktuj go jak hasło;
            w razie wycieku odwołaj go i wygeneruj nowy.
          </p>
          <ApiKeysManager />
        </Section>

        <Section id="auth" title="2. Uwierzytelnianie">
          <p>
            Klucz przekazujesz w nagłówku <Pill>Authorization: Bearer …</Pill> (albo
            alternatywnie <Pill>X-API-Key: …</Pill>):
          </p>
          <Code>{`Authorization: Bearer pauza_sk_twoj_klucz`}</Code>
        </Section>

        <Section id="bazowy-adres" title="3. Adres bazowy, błędy i limity">
          <p>
            Adresem bazowym jest origin Twojej instalacji Pauzy (w przykładach niżej:{" "}
            <code className="font-mono">https://twoja-pauza.example</code> — podmień na
            swój). Wszystkie żądania i odpowiedzi używają <strong>JSON</strong> (
            <code className="font-mono">Content-Type: application/json</code>).
          </p>
          <p>Błędy mają jednolity kształt:</p>
          <Code>{`{ "error": "opis problemu" }`}</Code>
          <p>Kody odpowiedzi:</p>
          <ul className="ml-5 list-disc">
            <li>
              <Pill>200</Pill> / <Pill>201</Pill> — sukces
            </li>
            <li>
              <Pill>400</Pill> — błąd walidacji (np. brak pola, zły format daty)
            </li>
            <li>
              <Pill>401</Pill> — brak lub nieprawidłowy klucz API
            </li>
            <li>
              <Pill>429</Pill> — wyczerpany dzienny limit rozmów z Ekspertem
            </li>
            <li>
              <Pill>500</Pill> / <Pill>502</Pill> — błąd po stronie serwera lub modelu
            </li>
          </ul>
          <p>
            <strong>Limity:</strong> endpoint Eksperta ma dzienny limit zapytań na
            użytkownika (oraz globalny). Po przekroczeniu zwraca <Pill>429</Pill>.
            Dodawanie i odczyt wpisów nie są limitowane.
          </p>
          <p>
            <strong>Daty</strong> mają format <code className="font-mono">yyyy-MM-dd</code>.
            Gdy pominiesz datę, używamy „dzisiaj&quot; w strefie Europe/Warsaw.
          </p>
        </Section>

        <Section id="dodaj-wpis" title="4. POST /api/v1/entries — dodaj wpis">
          <p>
            Dodaje nowy wpis do dziennika. Domyślnie na dzisiejszy dzień. Wymagany jest
            tylko <code className="font-mono">text</code>; reszta jest opcjonalna.
          </p>
          <p>Pola w ciele żądania (JSON):</p>
          <ul className="ml-5 list-disc">
            <li>
              <code className="font-mono">text</code> <strong>(wymagane)</strong> — treść
              wpisu (zwykły tekst; podwójna nowa linia rozdziela akapity).
            </li>
            <li>
              <code className="font-mono">date</code> — data wpisu (
              <code className="font-mono">yyyy-MM-dd</code>), domyślnie dziś.
            </li>
            <li>
              <code className="font-mono">mood</code> — nastrój, liczba 1–5 (patrz
              słowniki).
            </li>
            <li>
              <code className="font-mono">title</code> — opcjonalny tytuł.
            </li>
            <li>
              <code className="font-mono">event</code> — obiekt zdarzenia:{" "}
              <code className="font-mono">types</code> (tablica wartości z listy typów),{" "}
              <code className="font-mono">note</code> (opis), <code className="font-mono">favorite</code>{" "}
              (boolean).
            </li>
          </ul>
          <p>Przykład (curl):</p>
          <Code>{`curl -X POST https://twoja-pauza.example/api/v1/entries \\
  -H "Authorization: Bearer pauza_sk_twoj_klucz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Dziś był dobry dzień. Spotkałam się ze znajomymi.",
    "mood": 4,
    "event": { "types": ["spotkanie", "kawiarnia"], "note": "Kawa z Anią", "favorite": true }
  }'`}</Code>
          <p>Odpowiedź (201):</p>
          <Code>{`{
  "entry": {
    "id": "b1f2…",
    "title": "",
    "content": "<p>Dziś był dobry dzień. Spotkałam się ze znajomymi.</p>",
    "date": "2026-06-07",
    "mood": 4,
    "eventTypes": ["spotkanie", "kawiarnia"],
    "eventNote": "Kawa z Anią",
    "eventFavorite": true,
    "photoPath": null,
    "photoUrl": null,
    "createdAt": "2026-06-07T10:12:00.000Z",
    "updatedAt": "2026-06-07T10:12:00.000Z"
  }
}`}</Code>
          <p className="text-muted-foreground">
            Uwaga: zdjęcia nie są obsługiwane w API v1 (<code className="font-mono">photoPath</code>{" "}
            zawsze <code className="font-mono">null</code>).
          </p>
        </Section>

        <Section id="pobierz-wpisy" title="5. GET /api/v1/entries — wpisy z dnia">
          <p>
            Zwraca wszystkie wpisy z podanego dnia (dzień może mieć ich kilka). Datę
            podajesz w parametrze zapytania <code className="font-mono">date</code>;
            domyślnie dziś.
          </p>
          <p>Przykład (curl):</p>
          <Code>{`curl https://twoja-pauza.example/api/v1/entries?date=2026-06-07 \\
  -H "Authorization: Bearer pauza_sk_twoj_klucz"`}</Code>
          <p>Odpowiedź (200):</p>
          <Code>{`{
  "date": "2026-06-07",
  "entries": [
    {
      "id": "b1f2…",
      "title": "",
      "content": "<p>Dziś był dobry dzień…</p>",
      "date": "2026-06-07",
      "mood": 4,
      "eventTypes": ["spotkanie", "kawiarnia"],
      "eventNote": "Kawa z Anią",
      "eventFavorite": true,
      "photoPath": null,
      "photoUrl": null,
      "createdAt": "2026-06-07T10:12:00.000Z",
      "updatedAt": "2026-06-07T10:12:00.000Z"
    }
  ]
}`}</Code>
        </Section>

        <Section id="ekspert" title="6. POST /api/v1/expert — zapytaj Eksperta">
          <p>
            Zadaje pytanie Ekspertowi (asystent w nurcie CBT). Domyślnie patrzy na całość
            dziennika. Jeśli podasz <code className="font-mono">date</code>, rozmowa
            dotyczy tylko tego dnia, a historia rozmowy z tego dnia jest zapamiętywana
            (kolejne pytania kontynuują wątek).
          </p>
          <p>Pola w ciele żądania (JSON):</p>
          <ul className="ml-5 list-disc">
            <li>
              <code className="font-mono">message</code> <strong>(wymagane)</strong> —
              Twoje pytanie.
            </li>
            <li>
              <code className="font-mono">date</code> — opcjonalna data (
              <code className="font-mono">yyyy-MM-dd</code>) ustawiająca kontekst na jeden
              dzień.
            </li>
          </ul>
          <p>Przykład (curl):</p>
          <Code>{`curl -X POST https://twoja-pauza.example/api/v1/expert \\
  -H "Authorization: Bearer pauza_sk_twoj_klucz" \\
  -H "Content-Type: application/json" \\
  -d '{ "message": "Jaki schemat widzisz w moich nastrojach?", "date": "2026-06-07" }'`}</Code>
          <p>Odpowiedź (200):</p>
          <Code>{`{ "reply": "Zauważ, że w dni z aktywnością nastrój jest wyższy…" }`}</Code>
          <p className="text-muted-foreground">
            Po przekroczeniu dziennego limitu endpoint zwróci <Pill>429</Pill>.
          </p>
        </Section>

        <Section id="slowniki" title="7. Słowniki">
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

        <p className="mt-4 text-sm text-muted-foreground">
          Wskazówka dla agentów: wszystkie pola, formaty dat i słowniki są jednoznaczne i
          stabilne. Najprostszy przepływ to: dodaj wpis (
          <code className="font-mono">POST /api/v1/entries</code>) → zadaj pytanie o ten
          dzień (<code className="font-mono">POST /api/v1/expert</code> z{" "}
          <code className="font-mono">date</code>).
        </p>
      </div>
    </div>
  );
}
