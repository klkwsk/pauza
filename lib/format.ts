import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

// "yyyy-MM-dd" -> "31 maja 2026"
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "d MMMM yyyy", { locale: pl });
  } catch {
    return date;
  }
}

// Dzisiejsza data jako "yyyy-MM-dd" (czas lokalny).
export function todayISODate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// HTML -> czysty fragment tekstu na kafelek listy.
export function getExcerpt(html: string, maxLength = 140): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

// Czy treść z edytora jest pusta (Tiptap zwraca "<p></p>" dla pustego dokumentu).
export function isContentEmpty(html: string): boolean {
  return getExcerpt(html).length === 0;
}
