"use client";

import { MOODS } from "@/lib/moods";
import type { Mood } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MoodFace } from "@/components/mood-faces";

type MoodPickerProps = {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
};

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Nastrój">
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={m.label}
            title={m.label}
            onClick={() => onChange(active ? null : m.value)}
            style={{ borderWidth: "1px" }}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "scale-110 border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-primary"
            )}
          >
            <MoodFace mood={m.value} className="size-7" />
          </button>
        );
      })}
    </div>
  );
}
