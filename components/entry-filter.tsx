"use client";

import { XIcon } from "lucide-react";

import { EVENT_TYPES } from "@/lib/events";
import { cn } from "@/lib/utils";

type EntryFilterProps = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Liczba wpisów per typ zdarzenia przy aktualnym układzie. */
  counts?: Record<string, number>;
};

// Filtry wpisów wg typów zdarzeń (wielokrotny wybór, logika LUB).
// Gdy zaznaczony jest co najmniej jeden filtr, na końcu listy pojawia się
// przycisk „x" czyszczący zaznaczenia.
export function EntryFilter({ value, onChange, counts }: EntryFilterProps) {
  function toggle(type: string) {
    onChange(
      value.includes(type)
        ? value.filter((t) => t !== type)
        : [...value, type],
    );
  }

  const hasSelection = value.length > 0;

  return (
    <div
      className="flex flex-wrap justify-start gap-1.5"
      role="group"
      aria-label="Filtruj wpisy"
    >
      {EVENT_TYPES.map((t) => {
        const active = value.includes(t.value);
        const count = counts?.[t.value] ?? 0;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(t.value)}
            style={{ borderWidth: "1px" }}
            className={cn(
              "inline-flex items-center gap-1 border px-2 py-0.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-primary",
            )}
          >
            {t.label}
            <span
              className={cn(
                "tabular-nums",
                active ? "text-white/70" : "text-primary/60",
              )}
            >
              ({count})
            </span>
          </button>
        );
      })}

      {hasSelection && (
        <button
          type="button"
          onClick={() => onChange([])}
          aria-label="Wyczyść filtry"
          style={{ borderWidth: "1px" }}
          className="flex items-center justify-center border border-border bg-card px-1.5 py-0.5 text-primary transition-colors outline-none hover:text-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
