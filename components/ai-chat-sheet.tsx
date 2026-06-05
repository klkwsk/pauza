"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { Button } from "@/components/ui/button";
import { SendIcon, SparkleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ChatRole = "user" | "agent";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  // Atrapa odpowiedzi agenta — bąbel „piszę…", dopóki nie ma prawdziwej logiki.
  pending?: boolean;
};

// Wysuwana od dołu warstwa z konwersacją (skorupa UI).
export function AiChatSheet({
  open,
  onOpenChange,
  messages,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Przewijaj do najnowszej wiadomości po każdej zmianie listy.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  const canSend = value.trim().length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-3xl bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom"
        >
          {/* Uchwyt + nagłówek */}
          <div className="flex flex-col items-center gap-3 px-5 pt-3 pb-2">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
            <div className="flex w-full items-center gap-2">
              <SparkleIcon className="size-5 shrink-0 text-primary" />
              <DialogPrimitive.Title className="font-heading text-base font-medium">
                Rozmowa z Ekspertem
              </DialogPrimitive.Title>
            </div>
          </div>

          {/* Lista bąbli */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-3"
          >
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>

          {/* Pole na kolejne wiadomości */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border bg-card/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Napisz wiadomość…"
              aria-label="Napisz wiadomość do agenta AI"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={!canSend}
              aria-label="Wyślij"
            >
              <SendIcon className="size-4" />
            </Button>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-base md:text-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
          message.pending && "text-muted-foreground italic",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
