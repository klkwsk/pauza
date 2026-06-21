import type { ReactNode } from "react";

// Wspólny szkielet ikon w „odręcznym” stylu (jak MoodFace):
// nieregularny obrys, zaokrąglone końce, kolor dziedziczony przez currentColor.
function IconBase({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
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
      {children}
    </svg>
  );
}

// Ołówek — ułożony po skosie, z opaską metalowej skuwki i krawędzią drewno/grafit
export function PencilIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M21.8 7.2 L24.8 10.2 L14 21 L8.4 23.6 L11.2 18.2 Z" />
      <path d="M19.6 9.4 L22.6 12.4" />
      <path d="M11.2 18.2 L14 21" />
    </IconBase>
  );
}

// Notes — okładka z górną spiralą (trzy oczka) i linijkami tekstu w środku
export function NotebookIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M9 9.5 C8.4 9.5 8 10 8 10.8 L8 24.6 C8 25.4 8.4 25.8 9 25.8 L23 25.8 C23.6 25.8 24 25.4 24 24.6 L24 10.8 C24 10 23.6 9.5 23 9.5 Z" />
      <path d="M11.5 7 C10.4 7.4 10.4 9.6 11.5 10.2" />
      <path d="M16 7 C14.9 7.4 14.9 9.6 16 10.2" />
      <path d="M20.5 7 C19.4 7.4 19.4 9.6 20.5 10.2" />
      <path d="M11.5 14.5 L20.4 14.5" />
      <path d="M11.5 18 L20.5 18" />
      <path d="M11.5 21.5 L17.8 21.5" />
    </IconBase>
  );
}

// Machająca dłoń — otwarta dłoń, jeden „odręczny” obrys z rozłożonymi palcami,
// lekko przechylona dla dynamiki; cieńsza kreska, by kontury palców były widoczne.
export function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <g transform="rotate(10 16 16)">
        {/* otwarta dłoń: kciuk z lewej, cztery rozwachlowane palce */}
        <path d="M4.5 16 C5.6 15 7 14.4 8.2 14.6 L8 7.4 C8 6.2 10 6 10 7 L11.3 13.8 C11.5 14.4 12 14.5 12.2 13.9 L12.5 5 C12.6 3.8 14.6 3.6 14.5 4.6 L15.6 13.8 C15.8 14.4 16.2 14.5 16.4 13.9 L16.5 5.8 C16.6 4.6 18.6 4.4 18.5 5.6 L19.4 13.8 C19.6 14.4 20.2 14.6 20.6 14 L20.6 9 C20.7 7.8 22.7 7.6 22.6 8.6 L23.4 16 C24 20 23 25 19 26 L12 26.4 C9 26.4 7.2 24 7.4 20 C7.5 18.6 6.6 18 5.2 18 C4 18 3.2 17 4.5 16 Z" />
        {/* kreski ruchu po lewej */}
        <path d="M4 7.4 C3 7.8 2.4 8.6 2.2 9.6" />
        <path d="M2 11.4 C2.6 11.6 3.2 12.2 3.4 13" />
      </g>
    </svg>
  );
}

// Stalówka — płaska „góra z ramionami” zwężająca się do czubka, ze szczeliną i otworem
export function NibIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M10 8.6 L22 8.6 C22.7 14 20 21.2 16 26.6 C12 21.2 9.3 14 10 8.6 Z" />
      <path d="M16 14.4 L16 23.4" />
      <circle cx="16" cy="12.4" r="1.5" />
    </IconBase>
  );
}

// Iskra / AI — duża czteroramienna gwiazdka z mniejszą obok, znak „inteligencji”
export function SparkleIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M13 6 C13.6 9.8 15.2 11.4 19 12 C15.2 12.6 13.6 14.2 13 18 C12.4 14.2 10.8 12.6 7 12 C10.8 11.4 12.4 9.8 13 6 Z" />
      <path d="M21.5 17 C21.8 19 22.6 19.8 24.6 20.1 C22.6 20.4 21.8 21.2 21.5 23.2 C21.2 21.2 20.4 20.4 18.4 20.1 C20.4 19.8 21.2 19 21.5 17 Z" />
    </IconBase>
  );
}

// Rozmowa — dymek z ogonkiem i trzema kropkami, znak „porozmawiaj”
export function ChatIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M9 7.5 L23 7.5 C24.6 7.5 26 8.9 26 10.5 L26 18.5 C26 20.1 24.6 21.5 23 21.5 L15 21.5 L9.5 25.5 L10 21.5 L9 21.5 C7.4 21.5 6 20.1 6 18.5 L6 10.5 C6 8.9 7.4 7.5 9 7.5 Z" />
      <path d="M11.6 14.5 L11.7 14.5" />
      <path d="M15.9 14.5 L16 14.5" />
      <path d="M20.2 14.5 L20.3 14.5" />
    </IconBase>
  );
}

// Wysyłka — strzałka skierowana w prawo, „odręczny” grocik
export function SendIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M7 16 L24 16" />
      <path d="M17.5 9.5 L24 16 L17.5 22.5" />
    </IconBase>
  );
}

// Kosz na śmieci — pokrywa z uchwytem, korpus i dwie kreski w środku
export function TrashIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M8.5 11 L23.5 11" />
      <path d="M13 11 L13 8.6 C13 7.8 13.6 7.6 14.4 7.6 L17.6 7.6 C18.4 7.6 19 7.8 19 8.6 L19 11" />
      <path d="M10 11 C10.6 17 11 22 11.6 24.8 C11.8 25.8 12.4 26 13 26 L19 26 C19.6 26 20.2 25.8 20.4 24.8 C21 22 21.4 17 22 11" />
      <path d="M14 14.5 L14.4 22.5" />
      <path d="M18 14.5 L17.6 22.5" />
    </IconBase>
  );
}

// Serduszko — wyróżnienie zdarzenia. `filled` wypełnia kształt kolorem.
export function HeartIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 25 C16 25 6 19.2 6 12.6 C6 9.2 8.5 7 11.3 7 C13.4 7 15.1 8.2 16 10 C16.9 8.2 18.6 7 20.7 7 C23.5 7 26 9.2 26 12.6 C26 19.2 16 25 16 25 Z" />
    </svg>
  );
}

// Strzałka w lewo (szewron) — do nawigacji między okresami
export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M19.5 8.5 C16.4 11 13.6 13.6 11 16 C13.6 18.6 16.4 21.2 19.5 23.5" />
    </IconBase>
  );
}

// Strzałka w prawo (szewron) — do nawigacji między okresami
export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12.5 8.5 C15.6 11 18.4 13.6 21 16 C18.4 18.6 15.6 21.2 12.5 23.5" />
    </IconBase>
  );
}
