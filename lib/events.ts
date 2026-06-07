// Typy zdarzeń dnia — wielokrotny wybór w formularzu wpisu.
// Wartość (value) trafia do bazy (entries.event_types text[]); etykieta (label)
// jest pokazywana w UI. Lista jest celowo prosta i rozszerzalna.
// Uporządkowane alfabetycznie (po etykiecie), „Inne" zawsze na końcu.
export const EVENT_TYPES = [
  { value: "kawiarnia", label: "Kawiarnia" },
  { value: "kino", label: "Kino" },
  { value: "koncert", label: "Koncert" },
  { value: "podroz", label: "Podróż" },
  { value: "restauracja", label: "Restauracja" },
  { value: "spotkanie", label: "Spotkania" },
  { value: "teatr", label: "Teatr" },
  { value: "trening", label: "Trening" },
  { value: "wystawa", label: "Wystawa" },
  { value: "inne", label: "Inne" },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]["value"];

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t.label]),
);

// Etykieta dla zapisanej wartości; nieznane wartości pokazujemy tak, jak są.
export function eventTypeLabel(value: string): string {
  return LABEL_BY_VALUE[value] ?? value;
}
