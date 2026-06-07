import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameMonth,
  isSameYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { pl } from "date-fns/locale";
import { EVENT_TYPES } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { Entry } from "@/lib/types";

// Zakresy widoku wykresu nastroju.
export type MoodRange = "week" | "month" | "year";

export interface MoodPoint {
  key: string; // unikalny klucz kubełka (data lub miesiąc)
  label: string; // etykieta na osi X
  value: number | null; // średni nastrój w kubełku (1–5) lub null gdy brak wpisów
  count: number; // liczba wpisów w kubełku
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Data odniesienia dla danego okresu: offset 0 = bieżący, -1 = poprzedni, +1 = następny.
function refDate(range: MoodRange, offset: number): Date {
  const now = new Date();
  if (range === "week") return addWeeks(now, offset);
  if (range === "month") return addMonths(now, offset);
  return addYears(now, offset);
}

// Czy istnieje następny okres do podejrzenia (blokada nawigacji „w przód” poza dziś).
export function hasNextPeriod(offset: number): boolean {
  return offset < 0;
}

// Granice okresu jako daty "yyyy-MM-dd" (porownywalne leksykalnie).
export function periodBounds(
  range: MoodRange,
  offset = 0
): { start: string; end: string } {
  const ref = refDate(range, offset);
  let start: Date;
  let end: Date;
  if (range === "week") {
    start = startOfWeek(ref, { weekStartsOn: 1 });
    end = endOfWeek(ref, { weekStartsOn: 1 });
  } else if (range === "month") {
    start = startOfMonth(ref);
    end = endOfMonth(ref);
  } else {
    start = startOfYear(ref);
    end = endOfYear(ref);
  }
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
}

// Liczba wystąpień każdego typu zdarzenia w danym okresie (klucz = EVENT_TYPES.value).
export function eventCounts(
  entries: Entry[],
  range: MoodRange,
  offset = 0
): Record<string, number> {
  const { start, end } = periodBounds(range, offset);
  const counts: Record<string, number> = {};
  for (const t of EVENT_TYPES) counts[t.value] = 0;

  for (const e of entries) {
    if (e.date < start || e.date > end) continue;
    for (const type of e.eventTypes) {
      counts[type] = (counts[type] ?? 0) + 1;
    }
  }
  return counts;
}

// Pierwsza niepusta linijka tekstu (zakładamy: tytuł zdarzenia w pierwszym wierszu).
function firstLine(text: string): string {
  return text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
}

// Wyróżnione („serduszkiem") zdarzenia w okresie, pogrupowane po typie.
// Tekst = pierwsza linijka opisu zdarzenia, a gdy brak — data wpisu.
export function eventHighlights(
  entries: Entry[],
  range: MoodRange,
  offset = 0
): Record<string, string[]> {
  const { start, end } = periodBounds(range, offset);
  const out: Record<string, string[]> = {};

  for (const e of entries) {
    if (!e.eventFavorite) continue;
    if (e.date < start || e.date > end) continue;
    const text = firstLine(e.eventNote) || formatDate(e.date);
    for (const type of e.eventTypes) {
      (out[type] ??= []).push(text);
    }
  }
  return out;
}

// Czytelny nagłówek okresu, np. „5–11 maja 2026", „maj 2026", „2026".
export function periodLabel(range: MoodRange, offset: number): string {
  const ref = refDate(range, offset);
  if (range === "year") return format(ref, "yyyy");
  if (range === "month") return format(ref, "LLLL yyyy", { locale: pl });

  const start = startOfWeek(ref, { weekStartsOn: 1 });
  const end = endOfWeek(ref, { weekStartsOn: 1 });
  if (isSameMonth(start, end)) {
    return `${format(start, "d")}–${format(end, "d MMMM yyyy", { locale: pl })}`;
  }
  if (isSameYear(start, end)) {
    return `${format(start, "d MMM", { locale: pl })} – ${format(end, "d MMM yyyy", { locale: pl })}`;
  }
  return `${format(start, "d MMM yyyy", { locale: pl })} – ${format(end, "d MMM yyyy", { locale: pl })}`;
}

// Grupuje nastroje wpisów w kubełki dla wskazanego okresu kalendarzowego
// (week = pon–nd, month = 1.–ostatni dzień, year = sty–gru) i zwraca ciągłą
// serię — kubełki bez wpisów mają value=null.
export function moodSeries(
  entries: Entry[],
  range: MoodRange,
  offset = 0
): MoodPoint[] {
  const ref = refDate(range, offset);
  const buckets = new Map<string, number[]>();
  const keyOf = (date: string) =>
    range === "year" ? date.slice(0, 7) : date; // yyyy-MM albo yyyy-MM-dd

  for (const e of entries) {
    if (e.mood == null) continue;
    const k = keyOf(e.date);
    const arr = buckets.get(k);
    if (arr) arr.push(e.mood);
    else buckets.set(k, [e.mood]);
  }

  const points: MoodPoint[] = [];

  if (range === "year") {
    const year = format(ref, "yyyy");
    for (let m = 0; m < 12; m++) {
      const mm = String(m + 1).padStart(2, "0");
      const k = `${year}-${mm}`;
      const arr = buckets.get(k);
      points.push({
        key: k,
        label: format(new Date(ref.getFullYear(), m, 1), "LLL", { locale: pl }),
        value: arr ? avg(arr) : null,
        count: arr?.length ?? 0,
      });
    }
    return points;
  }

  const start =
    range === "week" ? startOfWeek(ref, { weekStartsOn: 1 }) : startOfMonth(ref);
  const end =
    range === "week" ? endOfWeek(ref, { weekStartsOn: 1 }) : endOfMonth(ref);

  for (const day of eachDayOfInterval({ start, end })) {
    const k = format(day, "yyyy-MM-dd");
    const arr = buckets.get(k);
    points.push({
      key: k,
      label: range === "week" ? format(day, "EEEEEE", { locale: pl }) : format(day, "d"),
      value: arr ? avg(arr) : null,
      count: arr?.length ?? 0,
    });
  }
  return points;
}
