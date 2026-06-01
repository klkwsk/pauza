"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { format, eachDayOfInterval, subDays } from "date-fns";
import { pl } from "date-fns/locale";
import type { Entry } from "@/lib/types";

// Skróty dni tygodnia indeksowane przez getDay() (0=Nd)
const DAY_LABELS = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"] as const;

interface WeekCalendarProps {
  entries: Entry[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function WeekCalendar({ entries, selectedDate, onSelect }: WeekCalendarProps) {
  const todayRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [monthLabel, setMonthLabel] = useState("");

  const { todayStr, days } = useMemo(() => {
    const now = new Date();
    return {
      todayStr: format(now, "yyyy-MM-dd"),
      days: eachDayOfInterval({ start: subDays(now, 83), end: now }),
    };
  }, []);

  const entryDates = useMemo(
    () => new Set(entries.map((e) => e.date)),
    [entries]
  );

  // Nazwa miesiąca środkowego widocznego dnia (przeliczana przy scrollu)
  const updateMonth = useCallback(() => {
    const el = scrollRef.current;
    if (!el || days.length === 0) return;
    const itemWidth = el.scrollWidth / days.length;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    const idx = Math.min(days.length - 1, Math.max(0, Math.floor(centerX / itemWidth)));
    setMonthLabel(format(days[idx], "LLLL yyyy", { locale: pl }));
  }, [days]);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: "end", block: "nearest" });
    updateMonth();
  }, [updateMonth]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase text-muted-foreground">{monthLabel}</p>
      {/* py-1 daje przestrzeń na outline, który overflow-x:auto by ściął góra/dół */}
      <div
        ref={scrollRef}
        onScroll={updateMonth}
        className="flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingRight: "12px" }}
      >
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasEntry = entryDates.has(dateStr);
          const dayNum = format(day, "d");
          const label = DAY_LABELS[day.getDay()];

          // Wybrany dzień: outline w kolorze primary
          const outlineStyle = isSelected
            ? { outline: "1.5px solid var(--primary)", outlineOffset: "0px" }
            : undefined;

          return (
            <button
              key={dateStr}
              ref={isToday ? todayRef : undefined}
              type="button"
              onClick={() => onSelect(dateStr)}
              style={outlineStyle}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2.5 py-2.5 transition-colors"
              aria-pressed={isSelected}
              aria-label={`${label} ${dayNum}${hasEntry ? ", masz wpis" : ""}`}
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {label}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-foreground">
                {dayNum}
              </span>
              {/* Kropka w stylu kalendarza iOS — oznacza dzień z wpisem */}
              <span
                className={`-mt-[3px] h-[7px] w-[7px] rounded-full ${
                  hasEntry ? "bg-primary" : "bg-transparent"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
        <span className="w-2 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
