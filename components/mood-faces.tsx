import type { ReactNode } from "react";
import type { Mood } from "@/lib/types";

// Nieregularny, „odręczny" obrys twarzy — celowo lekko krzywe krzywe Béziera,
// żeby uzyskać szkicowy, rysowany ręką charakter.
const WOBBLY_CIRCLE =
  "M16 3.4 C22.6 2.6 29.2 8 28.7 15.3 C29.4 22.5 22.5 29.2 15.3 28.6 C8.3 29.4 2.8 22.6 3.3 15.5 C2.7 8.4 9.3 3.7 16 3.4 Z";

// Oczka jako krótkie, lekko krzywe kreski
const EYES = (
  <>
    <path d="M12 11.9 C11.8 12.7 11.9 13.6 12.1 14.4" />
    <path d="M20 11.9 C20.2 12.7 20.1 13.6 19.9 14.4" />
  </>
);

// Wesołe, łukowate oczka dla najlepszego nastroju
const HAPPY_EYES = (
  <>
    <path d="M10.6 13.6 C11.4 12.3 12.7 12.3 13.5 13.5" />
    <path d="M18.5 13.5 C19.3 12.3 20.6 12.3 21.4 13.6" />
  </>
);

// Najsmutniejszy nastrój — „zmartwione” brwi uniesione w środku + zatroskane oczka
const SAD_EYES = (
  <>
    <path d="M10.4 12.4 C11.3 11.1 12.4 10.9 13.3 11.2" />
    <path d="M21.6 12.4 C20.7 11.1 19.6 10.9 18.7 11.2" />
    <path d="M12.1 13.6 C11.95 14.1 11.95 14.6 12.05 15" />
    <path d="M19.9 13.6 C20.05 14.1 20.05 14.6 19.95 15" />
  </>
);

// Usta zależne od nastroju (1 = smutny … 5 = uradowany)
const MOUTHS: Record<Mood, string> = {
  1: "M10 25 C12.7 18.4 19.3 18.3 22 24.8",
  2: "M11 22.6 C13.4 20 18.6 19.9 21 22.4",
  3: "M11 21.7 C14 21.4 18 22.2 21 21.6",
  4: "M11 21 C13.6 24.2 18.4 24.1 21 20.8",
  5: "M10.4 20.4 C13.2 26.6 18.8 26.5 21.6 20.3",
};

const EYES_BY_MOOD: Record<Mood, ReactNode> = {
  1: SAD_EYES,
  2: EYES,
  3: EYES,
  4: EYES,
  5: HAPPY_EYES,
};

export function MoodFace({
  mood,
  className,
}: {
  mood: Mood;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={WOBBLY_CIRCLE} />
      {EYES_BY_MOOD[mood]}
      <path d={MOUTHS[mood]} />
    </svg>
  );
}
