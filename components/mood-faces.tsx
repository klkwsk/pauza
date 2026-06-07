import type { ReactNode, SVGProps } from "react";
import type { Mood } from "@/lib/types";

// Topiący się „acid smiley" — wypełnienie żółte, czarny obrys i rysy (knockout-blob).
// Kolorystyczny akcent celowo wyłamuje się z czarno-białej, liniowej rodziny ikon.
// Im gorszy nastrój (1), tym mocniej twarz się rozpływa i ścieka kroplami.
const ACID = "#FFD400";
const INK = "#000000";

// Sylwetki twarzy: 3–5 okrągłe (trzymają formę), 1–2 topią się i kapią coraz mocniej.
const ROUND =
  "M16 3 C22.8 3 29 8.4 29 15 C29 21.6 22.8 27 16 27 C9.2 27 3 21.6 3 15 C3 8.4 9.2 3 16 3 Z";
const BODIES: Record<Mood, string> = {
  5: ROUND,
  4: ROUND,
  3: ROUND,
  2: "M16 3 C22.8 3 29 8.2 29 14.8 C29 21 23.6 26.2 17.2 26.6 C17 27.8 16.7 29.2 15.6 29.3 C14.5 29.4 14.1 28 14 26.5 C8 26 3 21.2 3 14.8 C3 8.2 9.2 3 16 3 Z",
  1: "M16 2.4 C22.8 2.4 28.6 7 28.6 13.2 C28.6 17 27 20 24.2 21.8 C23.4 23.4 22.4 24.4 21 24.8 C19.6 25.2 19.4 27 19 28.6 C18.7 30 18.4 31.2 17 31.4 C15.6 31.6 14.6 30.6 14.4 29.2 C14.1 27.4 14 25.4 13 24.8 C11.6 24.4 10 24.2 8.6 23.4 C5.4 21.6 3.4 17.4 3.4 13.2 C3.4 7 9.2 2.4 16 2.4 Z",
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
