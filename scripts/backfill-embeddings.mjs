// Backfill embeddingów dla wpisów bez wektora (kolumna entries.embedding).
// Liczy OpenAI text-embedding-3-small dla tekstu = tytuł + treść (HTML → plain).
//
// Uruchomienie (z katalogu pauza/):
//   node --env-file=.env.local scripts/backfill-embeddings.mjs
//
// Idempotentny: bierze tylko wiersze z embedding IS NULL, partiami.

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_SECRET =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error("Brak OPENAI_API_KEY — dodaj go do .env.local.");
  process.exit(1);
}

// Cienki klient REST Supabase (omija supabase-js — brak WebSocket w Node 20).
const SB_HEADERS = {
  apikey: SUPABASE_SECRET,
  Authorization: `Bearer ${SUPABASE_SECRET}`,
  "Content-Type": "application/json",
};
async function sbFetch(path, { method = "GET", headers = {}, body } = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...SB_HEADERS, ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH = 100; // tekstów na jedno wywołanie OpenAI

// HTML (Tiptap) → czysty tekst (spójnie z lib/ai/expert-context.ts:stripHtml).
function stripHtml(html) {
  return (html ?? "")
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

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

async function main() {
  let total = 0;
  for (;;) {
    const res = await sbFetch(
      `/rest/v1/entries?embedding=is.null&select=id,title,content&limit=${BATCH}`,
    );
    if (!res.ok) throw new Error(`select ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    const texts = rows.map((r) => {
      const t = (r.title ?? "").trim();
      const body = stripHtml(r.content);
      return (t ? t + "\n" : "") + body || "(pusty wpis)";
    });

    const vectors = await embedBatch(texts);

    // Update per wiersz (pgvector przyjmuje literał tekstowy "[...]").
    for (let i = 0; i < rows.length; i++) {
      const upRes = await sbFetch(`/rest/v1/entries?id=eq.${rows[i].id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { embedding: JSON.stringify(vectors[i]) },
      });
      if (!upRes.ok) throw new Error(`update ${upRes.status}: ${await upRes.text()}`);
    }

    total += rows.length;
    console.log(`Zembeddowano ${rows.length} (łącznie: ${total}).`);
  }

  console.log(`Gotowe. Uzupełniono embeddingi dla ${total} wpisów.`);
}

main().catch((e) => {
  console.error("Błąd krytyczny:", e);
  process.exit(1);
});
