"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoodPicker } from "@/components/mood-picker";
import { EventTypePicker } from "@/components/event-type-picker";
import { HeartIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DeleteEntryDialog } from "@/components/delete-entry-dialog";
import {
  createEntry,
  deleteEntry,
  updateEntry,
  uploadEntryPhoto,
} from "@/lib/storage";
import { formatDate, isContentEmpty, todayISODate } from "@/lib/format";
import type { Entry, Mood } from "@/lib/types";

export function EntryForm({
  entry,
  onSaved,
  onCancel,
  onDeleted,
}: {
  entry?: Entry;
  // Callbacki dla wariantu inline (desktop). Gdy nie podane → nawigacja na „/".
  onSaved?: (saved: Entry) => void;
  onCancel?: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(entry);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [date, setDate] = useState(entry?.date ?? todayISODate());
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [eventTypes, setEventTypes] = useState<string[]>(
    entry?.eventTypes ?? [],
  );
  const [eventNote, setEventNote] = useState(entry?.eventNote ?? "");
  const [eventFavorite, setEventFavorite] = useState(
    entry?.eventFavorite ?? false,
  );
  const [contentError, setContentError] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Zdjęcie: istniejąca ścieżka, nowo wybrany plik i podgląd (URL lokalny lub podpisany).
  const [photoPath, setPhotoPath] = useState<string | null>(
    entry?.photoPath ?? null,
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    entry?.photoUrl ?? null,
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Walidacja + ustawienie zdjęcia — wspólne dla wyboru pliku i drag&drop.
  function acceptPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Wybierz plik graficzny.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Zdjęcie może mieć maksymalnie 25 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptPhoto(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptPhoto(file);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPath(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isContentEmpty(content)) {
      setContentError(true);
      toast.error("Dodaj treść wpisu.");
      return;
    }
    setSubmitting(true);
    try {
      // Najpierw wgrywamy nowe zdjęcie (jeśli wybrane), żeby mieć jego ścieżkę.
      let finalPhotoPath = photoPath;
      if (photoFile) {
        finalPhotoPath = await uploadEntryPhoto(photoFile);
      }
      const input = {
        title: title.trim(),
        content,
        date,
        mood,
        eventTypes,
        eventNote: eventNote.trim(),
        eventFavorite,
        photoPath: finalPhotoPath,
      };
      let saved: Entry;
      if (isEdit && entry) {
        saved = (await updateEntry(entry.id, input)) ?? { ...entry, ...input };
        toast.success("Zapisano zmiany.");
      } else {
        saved = await createEntry(input);
        toast.success("Wpis zapisany.");
      }
      if (onSaved) {
        onSaved(saved);
        setSubmitting(false);
      } else {
        router.push("/");
      }
    } catch {
      setSubmitting(false);
      toast.error("Nie udało się zapisać wpisu.");
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      toast.success("Wpis usunięty.");
      if (onDeleted) onDeleted();
      else router.push("/");
    } catch {
      toast.error("Nie udało się usunąć wpisu.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-xl bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Tytuł</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nadaj wpisowi nazwę…"
          className="h-10"
          style={{ borderWidth: "1px" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Nastrój</Label>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="gap-1">
          Jaki był Twój dzień?<span className="text-primary">*</span>
        </Label>
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            if (contentError) setContentError(false);
          }}
          invalid={contentError}
        />
        {contentError && (
          <p className="text-sm text-destructive">Treść jest wymagana.</p>
        )}
      </div>

      <div
        style={{ borderWidth: "1px" }}
        className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <Label>Co fajnego się zdarzyło?</Label>
          <button
            type="button"
            onClick={() => setEventFavorite((v) => !v)}
            aria-pressed={eventFavorite}
            aria-label="Wyróżnij to wydarzenie"
            title="Wyróżnij to wydarzenie"
            style={{ borderWidth: "1px" }}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              eventFavorite
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-primary",
            )}
          >
            <HeartIcon filled={eventFavorite} className="size-5" />
          </button>
        </div>
        <EventTypePicker value={eventTypes} onChange={setEventTypes} />
        <Textarea
          value={eventNote}
          onChange={(e) => setEventNote(e.target.value)}
          placeholder="Np. tytuł filmu, skład muzyków, Twoje odczucia…"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Zdjęcie</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        {photoPreview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Podgląd zdjęcia wpisu"
              className="max-h-64 w-auto object-cover"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              aria-label="Usuń zdjęcie"
              title="Usuń zdjęcie"
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card px-6 py-10 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              dragOver
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            <ImagePlusIcon className="size-7" />
            <span className="text-sm font-medium">
              Przeciągnij zdjęcie tutaj lub kliknij, aby wybrać
            </span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG, WEBP lub GIF, maks. 25 MB
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="gap-1">
          Data<span className="text-primary">*</span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-10 w-56 justify-start bg-card font-normal"
                style={{ borderWidth: "1px" }}
              />
            }
          >
            <CalendarIcon className="text-muted-foreground" />
            {formatDate(date)}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseISO(date)}
              defaultMonth={parseISO(date)}
              onSelect={(d) => {
                if (d) {
                  setDate(format(d, "yyyy-MM-dd"));
                  setCalendarOpen(false);
                }
              }}
              locale={pl}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        <div>{isEdit && <DeleteEntryDialog onConfirm={handleDelete} />}</div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={() => (onCancel ? onCancel() : router.push("/"))}
          >
            Anuluj
          </Button>
          <Button type="submit" className="h-10" disabled={submitting}>
            {submitting ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </div>
    </form>
  );
}
