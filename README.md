# Pauza

Aplikacja do **journalingu** z asystentem w nurcie terapii poznawczo-behawioralnej
(„Ekspert"). Zapisujesz dni (treść, nastrój, zdarzenia, zdjęcie), przeglądasz je na
kalendarzu i w podsumowaniach, a Ekspert (model AI) pomaga spojrzeć na nie z perspektywy
CBT. Pauza udostępnia też **publiczne REST API** oraz **serwer MCP**, żeby agenci AI mogli
korzystać z dziennika programowo.

Produkcja: <https://pauza-journal.vercel.app>

## Stack

- **Next.js 16.2.6** (App Router, Turbopack) + **React 19**. Next 16 wprowadza zmiany
  łamiące względem wersji 13–15 — m.in. `middleware.ts` zostało zastąpione przez
  `proxy.ts` (tu: ochrona tras). Wskazówki dla asystentów AI: [`AGENTS.md`](AGENTS.md).
- **Tailwind CSS v4** + **shadcn/ui** w wariancie **Base UI** (ikony `lucide-react`).
- **Tiptap v3** — edytor rich-text treści wpisu.
- **Supabase** — auth (e-mail + hasło), Postgres z RLS, Storage (zdjęcia wpisów).
- **Anthropic** (`@anthropic-ai/sdk`, model `claude-haiku-4-5`) — Ekspert CBT.
- **OpenAI** (`text-embedding-3-small`) — embeddingi do **wyszukiwania hybrydowego (RAG)**
  używanego przez Eksperta.
- **Node 20** (zalecane przez nvm).

## Szybki start

```bash
nvm use 20            # lub dowolny Node 20.x
npm install
cp .env.example .env.local   # uzupełnij wartości (patrz niżej)
npm run dev                  # http://localhost:3000
```

### Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` i uzupełnij:

| Zmienna | Opis |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz publiczny (publishable / anon). |
| `SUPABASE_SECRET_KEY` | Klucz „secret" (service-role). **Tylko server-side.** Wymagany przez `/api/v1/*` i serwer MCP (omija RLS, ręcznie zawęża po `user_id`). |
| `ANTHROPIC_API_KEY` | Klucz Anthropic — odpowiedzi Eksperta. |
| `OPENAI_API_KEY` | Klucz OpenAI — embeddingi (RAG). Bez niego Ekspert używa fallbacku do ostatnich 30 wpisów. |

## Skrypty

```bash
npm run dev     # serwer deweloperski (Turbopack)
npm run build   # build produkcyjny
npm run start   # serwer produkcyjny
npm run lint    # eslint
```

Skrypty utrzymaniowe (`scripts/`, uruchamiane `node scripts/<nazwa>.mjs`):

- `backfill-embeddings.mjs` — dolicza embeddingi dla wpisów bez wektora.
- `seed-synthetic.mjs` — dane testowe.
- `match-photos.mjs`, `attach-photos.mjs` — narzędzia do zdjęć.

## Funkcje

- **Wpisy** — CRUD; treść rich-text, nastrój 1–5, typy zdarzeń + opis, wyróżnianie
  („serduszko"), jedno zdjęcie na wpis (prywatny bucket + signed URL).
- **Przegląd** — kalendarz tygodniowy, filtry po typach zdarzeń, layout master/detail na
  desktopie, lewy pasek boczny.
- **Podsumowanie** (`/stats`) — wykres nastroju (SVG) i statystyki zdarzeń w okresach
  tydzień/miesiąc/rok.
- **Ekspert (CBT)** — czat AI. Tryb dzienny (kontekst jednego dnia + trwała historia) lub
  ogólny (RAG po całym dzienniku). Dzienny limit zapytań per użytkownik.
- **REST API** (`/api/v1`) i **serwer MCP** (`/api/mcp`) — patrz niżej.

## Architektura

```
app/
  page.tsx                 # strona główna (lista + kalendarz + czat)
  new/, entry/[id]/edit/   # dodawanie / edycja wpisu
  stats/                   # podsumowanie
  login/                   # logowanie / rejestracja (e-mail + hasło)
  docs/                    # publiczna dokumentacja: zakładki API i MCP
  api/
    chat/                  # czat Eksperta dla UI (sesja + RLS)
    keys/                  # zarządzanie kluczami API (sesja)
    entries/embed/         # generowanie embeddingu wpisu
    v1/entries, v1/expert  # publiczne REST API (klucz API)
    [transport]/           # serwer MCP (/api/mcp)
lib/
  supabase/                # klienci: client (browser), server (sesja), admin (service-role)
  ai/                      # Ekspert: prompt, engine, kontekst, embeddings, retrieval (RAG)
  api/                     # auth kluczem, generowanie kluczy, warstwa serwisowa, auth MCP
  *.ts                     # types, storage, moods, events, stats, format, markdown, utils
hooks/                     # use-entries, use-profile, use-expert-chat
components/                # UI (w tym components/ui = shadcn/Base UI)
proxy.ts                   # ochrona tras (Next 16); /api/* i /docs/* publiczne
```

### Baza danych (Supabase)

Główne tabele (wszystkie pod **RLS** `auth.uid() = user_id`):

- `entries` — wpisy (treść, `date`, `mood`, `event_types[]`, `event_note`,
  `event_favorite`, `photo_path`, `embedding`).
- `chat_messages` — historia rozmów z Ekspertem (tryb dzienny).
- `api_keys` — klucze API per użytkownik (hash SHA-256, prefiks do wyświetlenia).
- `ai_usage` — licznik dzienny do rate-limitu Eksperta.

Storage: prywatny bucket `entry-photos` (RLS per folder użytkownika, signed URL przy
odczycie).

## Publiczne API i MCP

Pełna, interaktywna dokumentacja jest pod [`/docs`](https://pauza-journal.vercel.app/docs)
(zakładki **API** i **MCP**) — tam też wygenerujesz klucz API.

- **Uwierzytelnianie:** klucz API per użytkownik (`pauza_sk_…`) w nagłówku
  `Authorization: Bearer …` (lub `X-API-Key`). Ten sam klucz działa dla REST i MCP.
- **REST** (`/api/v1`): `POST /entries` (dodaj wpis), `GET /entries?date=` (wpisy z dnia),
  `POST /expert` (zapytaj Eksperta).
- **MCP** (`/api/mcp`, streamable HTTP): narzędzia `dodaj_wpis`, `pobierz_wpisy`,
  `zapytaj_eksperta`. Przykład podłączenia:

  ```bash
  claude mcp add --transport http pauza https://pauza-journal.vercel.app/api/mcp \
    --header "Authorization: Bearer pauza_sk_twoj_klucz"
  ```

## Deploy

Hostowane na **Vercel**; deploy następuje po wypchnięciu na gałąź `main`. Po zmianie
zmiennych środowiskowych konieczny jest redeploy (Vercel nie wstrzykuje nowych zmiennych do
już zbudowanego deploya).
