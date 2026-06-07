"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/events";
import { RangeTabs } from "@/components/range-tabs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
} from "@/components/icons";
import {
  eventCounts,
  eventHighlights,
  hasNextPeriod,
  periodLabel,
  type MoodRange,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

interface EventStatsProps {
  entries: Entry[];
}

export function EventStats({ entries }: EventStatsProps) {
  const [range, setRange] = useState<MoodRange>("week");
  // 0 = bieżący okres, -1 = poprzedni, itd. Zerowany przy zmianie zakresu.
  const [offset, setOffset] = useState(0);
  const counts = useMemo(
    () => eventCounts(entries, range, offset),
    [entries, range, offset]
  );
  const highlights = useMemo(
    () => eventHighlights(entries, range, offset),
    [entries, range, offset]
  );
  // Kolejność kafelków: gdy wszędzie 0 → alfabetycznie, inaczej malejąco po liczbie
  // (remis rozstrzyga alfabet).
  const ordered = useMemo(() => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return [...EVENT_TYPES].sort((a, b) =>
      total === 0
        ? a.label.localeCompare(b.label, "pl")
        : (counts[b.value] ?? 0) - (counts[a.value] ?? 0) ||
          a.label.localeCompare(b.label, "pl")
    );
  }, [counts]);
  const canGoNext = hasNextPeriod(offset);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-base font-normal">Wydarzenia</h2>
        <RangeTabs
          value={range}
          onChange={(r) => {
            setRange(r);
            setOffset(0);
          }}
        />
      </div>

      {/* Nawigacja okresów + nagłówek aktualnego okresu */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Poprzedni okres"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <span className="text-sm font-medium first-letter:uppercase">
          {periodLabel(range, offset)}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={!canGoNext}
          aria-label="Następny okres"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      <div className="grid auto-rows-fr grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-4">
        {ordered.map((t) => {
          const n = counts[t.value] ?? 0;
          const tips = highlights[t.value] ?? [];
          const hasTips = tips.length > 0;
          return (
            <div
              key={t.value}
              style={{ borderWidth: "1px" }}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                // Kafelek z wyróżnieniami zajmuje 2 kolumny → miejsce na drugą kolumnę
                hasTips
                  ? "col-span-2 flex items-start gap-4"
                  : "flex flex-col gap-1",
              )}
            >
              {/* Stała szerokość bloku licznik+label → listy ulubionych są wyrównane */}
              <div className="flex w-24 shrink-0 flex-col gap-1">
                <span
                  className={cn(
                    "font-heading text-3xl font-semibold tabular-nums",
                    n > 0 ? "text-primary" : "text-muted-foreground/40",
                  )}
                >
                  {n}
                </span>
                <span className="text-sm leading-tight text-muted-foreground">
                  {t.label}
                </span>
              </div>

              {hasTips && (
                <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-sm text-foreground"
                    >
                      <HeartIcon
                        filled
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      <span className="truncate">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
