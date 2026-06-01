import type { Mood } from "@/lib/types";

export type MoodOption = {
  value: Mood;
  emoji: string;
  label: string;
};

// Skala 5 emoji zgodnie z PRD: 😞 😕 😐 🙂 😄
export const MOODS: MoodOption[] = [
  { value: 1, emoji: "😞", label: "Źle" },
  { value: 2, emoji: "😕", label: "Słabo" },
  { value: 3, emoji: "😐", label: "Neutralnie" },
  { value: 4, emoji: "🙂", label: "Dobrze" },
  { value: 5, emoji: "😄", label: "Świetnie" },
];

export function moodEmoji(mood: Mood | null | undefined): string | null {
  if (!mood) return null;
  return MOODS.find((m) => m.value === mood)?.emoji ?? null;
}

export function moodLabel(mood: Mood | null | undefined): string | null {
  if (!mood) return null;
  return MOODS.find((m) => m.value === mood)?.label ?? null;
}
