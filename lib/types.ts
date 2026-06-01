// Skala nastroju: 1 (😞) … 5 (😄)
export type Mood = 1 | 2 | 3 | 4 | 5;

// Wpis dziennika przechowywany w localStorage.
export interface Entry {
  id: string;
  title: string; // opcjonalny w UI — pusty string gdy brak
  content: string; // HTML z edytora Tiptap (wymagany, niepusty)
  date: string; // "yyyy-MM-dd" — data wpisu
  mood: Mood | null; // opcjonalny
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Dane pochodzące z formularza (bez pól systemowych).
export type EntryInput = {
  title: string;
  content: string;
  date: string;
  mood: Mood | null;
};
