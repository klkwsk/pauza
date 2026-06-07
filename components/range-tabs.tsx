"use client";

import type { MoodRange } from "@/lib/stats";

const RANGES: { value: MoodRange; label: string }[] = [
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Miesiąc" },
  { value: "year", label: "Rok" },
];

// Wspólny przełącznik zakresu (tydzień/miesiąc/rok) — segmentowany.
export function RangeTabs({
  value,
  onChange,
}: {
  value: MoodRange;
  onChange: (range: MoodRange) => void;
}) {
  return (
    <div className="inline-flex border bg-card text-sm" style={{ borderWidth: "1px" }}>
      {RANGES.map((r, i) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          aria-pressed={value === r.value}
          className={`cursor-pointer px-3 py-1 font-medium transition-colors ${
            i > 0 ? "border-l" : ""
          } ${
            value === r.value
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-primary"
          }`}
          style={i > 0 ? { borderLeftWidth: "1px" } : undefined}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
