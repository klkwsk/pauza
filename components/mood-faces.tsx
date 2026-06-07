import type { ReactNode, SVGProps } from "react";
import type { Mood } from "@/lib/types";

// „Acid smiley" — wypełnienie żółte, czarny obrys i rysy (knockout-blob).
// Kolorystyczny akcent celowo wyłamuje się z czarno-białej, liniowej rodziny ikon.
// Nastrój rozróżniają usta i oczy; sylwetka jest jednakowo okrągła dla 1–5.
const ACID = "#FFD400";
const INK = "#000000";

// Wszystkie nastroje używają tej samej okrągłej sylwetki.
const ROUND =
  "M16 3 C22.8 3 29 8.4 29 15 C29 21.6 22.8 27 16 27 C9.2 27 3 21.6 3 15 C3 8.4 9.2 3 16 3 Z";
const BODIES: Record<Mood, string> = {
  5: ROUND,
  4: ROUND,
  3: ROUND,
  2: ROUND,
  1: ROUND,
};

// Usta jako cienka, falista kreska (jak w inspiracji #1) — od grymasu (1) po szeroki uśmiech (5).
const MOUTHS: Record<Mood, string> = {
  1: "M10.5 21 C12.9 16.4 19.1 16.4 21.5 21",
  2: "M10.5 22.6 C13 20 19 20 21.5 22.6",
  3: "M10 21 C12.4 22.4 14.2 19.8 16 21 C17.8 22.2 19.6 19.8 22 21",
  4: "M10.5 20.2 C13 23.4 19 23.4 21.5 20.2",
  5: "M10 20 C12.6 25 19.4 25 22 20",
};

// Oczy: czarne „blobowe" owale. Przy smutku (1–2) lekko przekrzywione, „zmartwione".
// Przy najlepszym nastroju (5) — śmiejące się, zamknięte łuki (◡◡).
function Eyes({ mood }: { mood: Mood }): ReactNode {
  if (mood === 5) {
    return (
      <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
        <path d="M10.4 13.8 C11.2 12 12.8 12 13.6 13.8" />
        <path d="M18.4 13.8 C19.2 12 20.8 12 21.6 13.8" />
      </g>
    );
  }
  const tilt = mood === 1 ? 22 : mood === 2 ? 12 : 0;
  return (
    <g fill={INK} stroke="none">
      <ellipse
        cx={12.2}
        cy={12.6}
        rx={1.55}
        ry={2.5}
        transform={tilt ? `rotate(${tilt} 12.2 12.6)` : undefined}
      />
      <ellipse
        cx={19.8}
        cy={12.6}
        rx={1.55}
        ry={2.5}
        transform={tilt ? `rotate(${-tilt} 19.8 12.6)` : undefined}
      />
    </g>
  );
}

export function MoodFace({
  mood,
  className,
  ...rest
}: {
  mood: Mood;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      {...rest}
    >
      <path
        d={BODIES[mood]}
        fill={ACID}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Eyes mood={mood} />
      <path
        d={MOUTHS[mood]}
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
