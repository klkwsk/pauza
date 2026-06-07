"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { X } from "lucide-react";

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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      disablePointerDismissal
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col overflow-hidden rounded-t-[20px] bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom sm:inset-x-auto sm:left-4 sm:bottom-6 sm:max-h-[75svh] sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-[20px] lg:left-4"
        >
          {/* Uchwyt + nagłówek */}
          <div className="flex flex-col items-center gap-3 px-5 pt-3 pb-2">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
            <div className="flex w-full items-center gap-2">
              <SparkleIcon className="size-5 shrink-0 text-primary" />
              <DialogPrimitive.Title className="font-heading text-base font-normal">
                Rozmowa z Ekspertem
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Zamknij"
                className="-mr-1 ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X className="size-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Lista bąbli */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-3"
          >
            {messages.length === 0 ? (
              <p className="m-auto max-w-[16rem] text-center text-sm text-muted-foreground">
                Napisz pierwszą wiadomość, a Ekspert odpowie i pomoże spojrzeć na
                Twoje wpisy z innej perspektywy.
              </p>
            ) : (
              messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))
            )}
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
              className="rounded-full"
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
          "max-w-[80%] rounded-[16px] px-3.5 py-2 text-base md:text-sm",
          isUser
            ? "rounded-br-[4px] bg-primary text-primary-foreground"
            : "rounded-bl-[4px] bg-muted text-foreground",
          message.pending && "text-muted-foreground italic",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
