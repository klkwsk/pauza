// Budowa kontekstu wpisów wstrzykiwanego do promptu Eksperta.
// Wyciągnięte z app/api/chat/route.ts, by współdzielić z publicznym /api/v1/expert.

// Wiersz wpisu w kształcie potrzebnym do sformatowania kontekstu.
export interface EntryRow {
  date: string;
  mood: number | null;
  title: string | null;
  content: string;
  event_types: string[] | null;
  event_note: string | null;
}

// Usuwa HTML z treści wpisu (Tiptap) → czysty tekst dla modelu.
export function stripHtml(html: string): string {
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

export const MOOD_LABEL: Record<number, string> = {
  1: "bardzo źle",
  2: "źle",
  3: "neutralnie",
  4: "dobrze",
  5: "bardzo dobrze",
};

export function formatEntries(rows: EntryRow[]): string {
  if (rows.length === 0) return "Brak wpisów.";
  return rows
    .map((e) => {
      const mood =
        e.mood != null
          ? `nastrój: ${e.mood}/5 (${MOOD_LABEL[e.mood] ?? "?"})`
          : "nastrój: brak";
      const title = e.title ? `\nTytuł: ${e.title}` : "";
      const events =
        e.event_types && e.event_types.length > 0
          ? `\nZdarzenia: ${e.event_types.join(", ")}`
          : "";
      const note = e.event_note ? `\nOpis zdarzenia: ${e.event_note}` : "";
      return `# ${e.date} — ${mood}${title}${events}${note}\n${stripHtml(e.content)}`;
    })
    .join("\n\n---\n\n");
}
