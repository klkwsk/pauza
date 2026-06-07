// Skala nastroju: 1 (😞) … 5 (😄)
export type Mood = 1 | 2 | 3 | 4 | 5;

// Wpis dziennika przechowywany w Supabase (tabela public.entries).
export interface Entry {
  id: string;
  title: string; // opcjonalny w UI — pusty string gdy brak
  content: string; // HTML z edytora Tiptap (wymagany, niepusty)
  date: string; // "yyyy-MM-dd" — data wpisu
  mood: Mood | null; // opcjonalny
  eventTypes: string[]; // opcjonalne typy zdarzeń (wartości z EVENT_TYPES), pusta tablica gdy brak
  eventNote: string; // opcjonalny opis zdarzenia (zwykły tekst), pusty string gdy brak
  eventFavorite: boolean; // wyróżnienie zdarzenia „serduszkiem"
  photoPath: string | null; // ścieżka pliku w Storage (bucket entry-photos), null gdy brak
  photoUrl: string | null; // podpisany URL do wyświetlenia (generowany przy odczycie), null gdy brak
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Dane pochodzące z formularza (bez pól systemowych).
export type EntryInput = {
  title: string;
  content: string;
  date: string;
  mood: Mood | null;
  eventTypes: string[];
  eventNote: string;
  eventFavorite: boolean;
  photoPath: string | null; // ścieżka pliku w Storage; null = brak/usunięte zdjęcie
};
