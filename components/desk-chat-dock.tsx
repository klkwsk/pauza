"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatBubble, type ChatMessage } from "@/components/ai-chat-sheet";
import { SendIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Stały, zadokowany panel rozmowy z Ekspertem — tylko desktop (hidden lg:flex).
// W odróżnieniu od mobilnego <AiChatSheet> jest zawsze widoczny: pole na wiadomość
// stoi otworem od razu, a historia rozmowy startuje zwinięta i rozwija się po kliknięciu.
// Zajmuje 1/3 szerokości ekranu, pływa wyśrodkowany przy dolnej krawędzi (24px marginesu).
export function DeskChatDock({
  messages,
  onSend,
  expandSignal,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  // Licznik bumpowany z zewnątrz (np. „Porozmawiaj" w pasku bocznym) — rozwija
  // historię i ustawia kursor w polu wpisywania.
  expandSignal: number;
}) {
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasHistory = messages.length > 0;

  // Reakcja na sygnał z zewnątrz: rozwiń historię i przejmij focus na polu.
  useEffect(() => {
    if (expandSignal === 0) return;
    if (hasHistory) setExpanded(true);
    inputRef.current?.focus();
  }, [expandSignal, hasHistory]);

  // Przewijaj do najnowszej wiadomości, gdy historia jest rozwinięta.
  useEffect(() => {
    if (!expanded) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, expanded]);

  // Gdy zniknie cała historia (np. zmiana dnia bez rozmowy) — domknij panel.
  useEffect(() => {
    if (!hasHistory) setExpanded(false);
  }, [hasHistory]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    // Po wysłaniu pokazujemy całą rozmowę — bez ręcznego rozwijania.
    setExpanded(true);
  }

  const canSend = value.trim().length > 0;
  const lastMessage = messages[messages.length - 1];

  return (
    <>
      {/* Warstwa pod czatem — gdy rozmowa rozwinięta: efekt zamglonego szkła —
          biaława poświata + matowe rozmycie. Klik gasi panel.
          Tylko desktop (≥ lg). */}
      {hasHistory && expanded && (
        <button
          type="button"
          aria-label="Zwiń rozmowę"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-40 hidden cursor-default bg-white/30 backdrop-blur-md animate-in fade-in-0 lg:block"
        />
      )}
      <section
        aria-label="Rozmowa z Ekspertem"
        className="fixed bottom-6 left-1/2 z-50 hidden w-[33.333vw] min-w-[22rem] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] border border-border bg-popover text-popover-foreground shadow-xl lg:flex"
      >
      {/* Historia rozwinięta — z wierszem zwijania na górze */}
      {hasHistory && expanded && (
        <>
          <div className="flex justify-end px-3 pt-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Zwiń rozmowę"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" />
            </button>
          </div>
          <div
            ref={scrollRef}
            className="flex max-h-[50svh] flex-1 flex-col gap-3 overflow-y-auto px-4 py-2"
          >
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>
        </>
      )}

      {/* Zwinięty podgląd ostatniej wiadomości — klik rozwija całość */}
      {hasHistory && !expanded && lastMessage && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="flex items-center gap-2 px-4 pt-3 pb-1 text-left text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
        >
          <span className="line-clamp-1 flex-1">
            {lastMessage.role === "user" ? "Ty: " : "Ekspert: "}
            {lastMessage.text}
          </span>
          <ChevronDown className="size-4 shrink-0 rotate-180" />
        </button>
      )}

      {/* Pole na wiadomość — zawsze widoczne */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          hasHistory && "mt-1 border-t border-border bg-card/50",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Porozmawiaj z ekspertem"
          aria-label="Napisz wiadomość do agenta AI"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={!canSend}
          aria-label="Wyślij"
          className="rounded-full"
        >
          <SendIcon className="size-4" />
        </Button>
      </form>
      </section>
    </>
  );
}
