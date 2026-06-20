// Embeddingi OpenAI (text-embedding-3-small, 1536 wymiarów).
// Jeden wpis = jeden wektor (bez chunkowania). Używane serwerowo:
//  - przy tworzeniu wpisu (auto-embedding),
//  - przy zapytaniu Eksperta w trybie "wszystkie" (embedding pytania → hybrid search).
// Klucz OPENAI_API_KEY tylko po stronie serwera — nigdy w przeglądarce.

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Brak OPENAI_API_KEY w środowisku.");
  return key;
}

// Liczy embeddingi dla tablicy tekstów (zachowuje kolejność).
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as {
    data: { index: number; embedding: number[] }[];
  };
  // API może zwrócić w innej kolejności — sortuj po index.
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// Liczy embedding dla pojedynczego tekstu.
export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedBatch([text]);
  return vec;
}
