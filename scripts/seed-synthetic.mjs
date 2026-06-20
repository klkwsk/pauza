// Seed ~1000 syntetycznych wpisów dziennika dla konta demo.
//
// Persona: kobieta, 39 lat, Warszawa, product designerka ucząca się AI w projektowaniu.
// Wpisy mają celowe wzorce emocjonalne (melancholia jesienią i w niedzielne wieczory,
// stres przed deadline'ami, lepszy nastrój latem/przy aktywności/podróżach), żeby
// wyszukiwanie hybrydowe w Ekspercie zwracało sensowne klastry.
//
// Treść generuje Claude Sonnet 4.6 (structured outputs). Embeddingi liczy osobny
// skrypt backfill-embeddings.mjs (kolumna fts wypełnia się sama — generated column).
//
// Uruchomienie (z katalogu pauza/):
//   node --env-file=.env.local scripts/seed-synthetic.mjs
//
// Skrypt jest idempotentny/wznawialny: dolicza wpisy do osiągnięcia TARGET_TOTAL.

import Anthropic from "@anthropic-ai/sdk";

// ── Konfiguracja ─────────────────────────────────────────────────────────────
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@pauza.local";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "test123";
const TARGET_TOTAL = Number(process.env.SEED_TARGET ?? 1000);
const BATCH = 10; // wpisów na jedno wywołanie modelu
const MODEL = "claude-sonnet-4-6";
const YEARS_BACK = 3;

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_SECRET =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Brak ANTHROPIC_API_KEY.");
  process.exit(1);
}

const anthropic = new Anthropic();

// Cienki klient REST/Admin Supabase (omija supabase-js — brak WebSocket w Node 20).
const SB_HEADERS = {
  apikey: SUPABASE_SECRET,
  Authorization: `Bearer ${SUPABASE_SECRET}`,
  "Content-Type": "application/json",
};

async function sbFetch(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...SB_HEADERS, ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return res;
}

// Dozwolone typy zdarzeń (zgodne z komentarzem kolumny entries.event_types).
const EVENT_TYPES = [
  "koncert", "wystawa", "teatr", "kino",
  "spotkanie", "restauracja", "kawiarnia", "inne",
];

// ── Persona (stały kontekst — cache'owany w system prompt) ───────────────────
const PERSONA = `
Piszesz prywatny dziennik w pierwszej osobie. Autorka:
- Kobieta, 39 lat, mieszka w Warszawie.
- Product designerka; od jakiegoś czasu intensywnie uczy się wykorzystania AI w swoim
  procesie projektowym. Towarzyszy temu mieszanka niepokoju (czy AI zastąpi rzemiosło,
  syndrom oszustki, nadążanie za tempem zmian) i ekscytacji nowymi możliwościami.
- Pasje: podróże po świecie (w każdym mieście odwiedza galerie i muzea — sztuka współczesna);
  muzyka instrumentalna (jazz, ambient, eksperymentalna — koncerty, płyty, słuchanie przy pracy);
  gotowanie i warszawskie knajpy.
- Ma psa rasy corgi (codzienne spacery, drobne radości i troski).
- Grono bliskich przyjaciół — rozmowy o kinie i książkach, dobre wino, kameralne wieczory.

Styl: szczery, refleksyjny, konkretny, naturalna polszczyzna. Bez patosu i frazesów.
Długość: 1–3 krótkie akapity. Czasem wspomina konkretne tytuły (filmy, książki, płyty,
wystawy), miejsca w Warszawie, imiona przyjaciół (np. Marta, Kuba, Zosia, Piotr), imię psa (Korma).
Wpisy mają być spójne w czasie (powracające wątki, ta sama osoba), ale nie powtarzalne.
`.trim();

const SYSTEM_SCHEMA_HINT = `
Zwróć obiekt JSON {"entries": [...]} z dokładnie tyloma elementami, ile slotów podano.
Każdy element:
- "index": liczba — numer slotu z wejścia (1:1),
- "title": krótki tytuł (czasem pusty ""),
- "content_html": treść jako prosty HTML (akapity <p>...</p>, ewentualnie <br>),
- "event_types": tablica z dozwolonego zbioru: ${EVENT_TYPES.join(", ")} (może być pusta),
- "event_note": krótki opis zdarzenia albo "" (gdy brak),
- "event_favorite": boolean (true tylko dla naprawdę wyjątkowych, miłych dni).
Uszanuj podany w slocie nastrój i ton (melancholijny/neutralny/pogodny) oraz motyw przewodni.
Pisz po polsku.
`.trim();

// ── Narzędzia dat / wzorców ──────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(2, "0");
}
function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function clampMood(m) {
  return Math.max(1, Math.min(5, m));
}

// Motywy z wagami; jesień/niedziela podbijają wątki melancholijne i zwątpienie wokół AI.
const THEMES_POSITIVE = [
  "podróż i zwiedzanie galerii/muzeów",
  "koncert muzyki instrumentalnej (jazz/ambient)",
  "udany eksperyment z AI w projekcie",
  "kolacja z przyjaciółmi przy winie, rozmowy o kinie/książkach",
  "gotowanie nowego dania / odkryta knajpa w Warszawie",
  "długi spacer z psem, aktywność na świeżym powietrzu",
];
const THEMES_NEUTRAL = [
  "zwykły dzień pracy nad projektem",
  "drobiazgi dnia codziennego, spacer z psem",
  "porządki, planowanie, refleksje o pracy z AI",
  "książka/film wieczorem, cicha sobota",
];
const THEMES_LOW = [
  "melancholia, tęsknota, zaduma nad mijającym czasem",
  "stres i presja przed deadline'em projektowym",
  "zwątpienie zawodowe wokół AI (czy nadążę, syndrom oszustki)",
  "zmęczenie, gorszy nastrój, niedzielny smutek",
];

// Buduje kontekst pojedynczego slotu (data → wzorzec nastroju i motyw).
function buildSlotContext() {
  const now = new Date();
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - YEARS_BACK);
  const span = now.getTime() - start.getTime();
  const d = new Date(start.getTime() + Math.random() * span);

  const month = d.getMonth() + 1; // 1..12
  const weekday = d.getDay(); // 0 = niedziela
  const isSunday = weekday === 0;
  const isAutumn = month === 10 || month === 11;
  const isWinter = month === 12 || month === 1 || month === 2;
  const isSummer = month >= 6 && month <= 8;

  // Bazowy nastrój + modyfikatory wzorców.
  let mood = 3;
  if (isSummer) mood += 1;
  if (isAutumn) mood -= 1;
  if (isWinter) mood -= 0;
  if (isSunday) mood -= 1;

  // Prawdopodobieństwo "niskiego" motywu rośnie jesienią i w niedziele.
  let lowBias = 0.25;
  if (isAutumn) lowBias += 0.3;
  if (isWinter) lowBias += 0.15;
  if (isSunday) lowBias += 0.2;

  let theme;
  let tone;
  const r = Math.random();
  if (r < lowBias) {
    theme = pick(THEMES_LOW);
    tone = "melancholijny";
    mood -= 1;
  } else if (r < lowBias + 0.4) {
    theme = pick(THEMES_NEUTRAL);
    tone = "neutralny";
  } else {
    theme = pick(THEMES_POSITIVE);
    tone = "pogodny";
    mood += 1;
  }
  mood = clampMood(mood + randInt(-1, 1) * 0); // delikatnie; wzorzec ma zostać czytelny

  const partOfDay = isSunday ? "niedzielny wieczór" : pick(["rano", "wieczór", "po pracy"]);

  return {
    date: isoDate(d),
    mood: clampMood(mood),
    tone,
    theme,
    partOfDay,
  };
}

// ── Konto demo ───────────────────────────────────────────────────────────────
async function ensureDemoUser() {
  const res = await sbFetch("/auth/v1/admin/users", {
    method: "POST",
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true },
  });
  if (res.ok) {
    const u = await res.json();
    console.log(`Utworzono konto demo: ${DEMO_EMAIL} (${u.id})`);
    return u.id;
  }

  // Już istnieje (422) lub inny błąd — spróbuj znaleźć po e-mailu (paginacja).
  for (let page = 1; page <= 30; page++) {
    const r = await sbFetch(`/auth/v1/admin/users?page=${page}&per_page=200`);
    if (!r.ok) throw new Error(`listUsers ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const users = data.users ?? data; // GoTrue: {users:[...]}
    const u = users.find((x) => x.email === DEMO_EMAIL);
    if (u) {
      console.log(`Konto demo już istnieje: ${DEMO_EMAIL} (${u.id})`);
      return u.id;
    }
    if (users.length < 200) break;
  }
  throw new Error(
    `Nie udało się utworzyć ani znaleźć konta ${DEMO_EMAIL}: ${res.status} ${await res.text()}`,
  );
}

// ── Generacja jednej paczki przez Sonnet 4.6 ─────────────────────────────────
async function generateBatch(slots) {
  const slotList = slots
    .map(
      (s, i) =>
        `Slot ${i + 1}: data ${s.date}, pora: ${s.partOfDay}, nastrój: ${s.mood}/5, ton: ${s.tone}, motyw przewodni: ${s.theme}`,
    )
    .join("\n");

  const schema = {
    type: "object",
    properties: {
      entries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            title: { type: "string" },
            content_html: { type: "string" },
            event_types: {
              type: "array",
              items: { type: "string", enum: EVENT_TYPES },
            },
            event_note: { type: "string" },
            event_favorite: { type: "boolean" },
          },
          required: [
            "index", "title", "content_html",
            "event_types", "event_note", "event_favorite",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["entries"],
    additionalProperties: false,
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [
      { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
      { type: "text", text: SYSTEM_SCHEMA_HINT },
    ],
    output_config: { format: { type: "json_schema", schema } },
    messages: [
      {
        role: "user",
        content:
          `Napisz ${slots.length} wpisów dziennika, po jednym na slot poniżej. ` +
          `Każdy wpis spójny z podaną datą, porą, nastrojem, tonem i motywem.\n\n${slotList}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = JSON.parse(text);
  return parsed.entries;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function countEntries(userId) {
  const res = await sbFetch(
    `/rest/v1/entries?user_id=eq.${userId}&select=id`,
    { headers: { Prefer: "count=exact", Range: "0-0" } },
  );
  if (!res.ok && res.status !== 206) {
    throw new Error(`count ${res.status}: ${await res.text()}`);
  }
  const cr = res.headers.get("content-range") ?? "";
  const total = Number(cr.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

async function main() {
  const userId = await ensureDemoUser();

  const existing = await countEntries(userId);
  let need = TARGET_TOTAL - existing;
  console.log(`Istniejące wpisy demo: ${existing}. Do wygenerowania: ${Math.max(0, need)}.`);
  if (need <= 0) {
    console.log("Cel już osiągnięty — nic do zrobienia.");
    return;
  }

  let inserted = 0;
  while (need > 0) {
    const n = Math.min(BATCH, need);
    const slots = Array.from({ length: n }, buildSlotContext);

    let entries;
    try {
      entries = await generateBatch(slots);
    } catch (e) {
      console.error("Błąd generacji paczki — ponawiam za 5 s:", e.message);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    const rows = entries
      .map((e) => {
        const slot = slots[(e.index ?? 0) - 1] ?? slots[0];
        const content = (e.content_html ?? "").trim();
        if (!content) return null;
        return {
          user_id: userId,
          title: (e.title ?? "").slice(0, 200),
          content,
          date: slot.date,
          mood: slot.mood,
          event_types: Array.isArray(e.event_types)
            ? e.event_types.filter((t) => EVENT_TYPES.includes(t))
            : [],
          event_note: (e.event_note ?? "").slice(0, 500),
          event_favorite: Boolean(e.event_favorite),
        };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      console.warn("Paczka pusta — pomijam.");
      continue;
    }

    const insRes = await sbFetch("/rest/v1/entries", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: rows,
    });
    if (!insRes.ok) {
      console.error(`Błąd zapisu paczki (${insRes.status}) — ponawiam za 5 s:`, await insRes.text());
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    inserted += rows.length;
    need -= rows.length;
    console.log(`Zapisano ${rows.length} (łącznie sesja: ${inserted}, pozostało: ${Math.max(0, need)}).`);
  }

  console.log(`Gotowe. Dodano ${inserted} wpisów dla ${DEMO_EMAIL}.`);
}

main().catch((e) => {
  console.error("Błąd krytyczny:", e);
  process.exit(1);
});
