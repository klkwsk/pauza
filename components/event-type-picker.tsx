"use client";

import { EVENT_TYPES } from "@/lib/events";
import { cn } from "@/lib/utils";

type EventTypePickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

// Wielokrotny wybór typów zdarzeń w formie badge'y (toggle).
export function EventTypePicker({ value, onChange }: EventTypePickerProps) {
  function toggle(type: string) {
    onChange(
      value.includes(type)
        ? value.filter((t) => t !== type)
        : [...value, type],
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Typ zdarzenia">
      {EVENT_TYPES.map((t) => {
        const active = value.includes(t.value);
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(t.value)}
            style={{ borderWidth: "1px" }}
            className={cn(
              "border px-3.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:text-primary",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
