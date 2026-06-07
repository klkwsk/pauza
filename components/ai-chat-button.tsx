"use client";

import { SparkleIcon } from "@/components/icons";
import { useChat } from "@/components/chat-context";

// Pływający trigger rozmowy z Ekspertem — tylko na mobile/tablet (lg:hidden).
// Na desktopie rolę przejmuje pozycja „Porozmawiaj" w pasku bocznym.
// Stan rozmowy (arkusz, historia) trzyma globalny ChatProvider.
export function AiChatButton() {
  const { openChat } = useChat();

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Porozmawiaj z Ekspertem"
      className="fixed bottom-24 left-1/2 z-50 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card pr-5 pl-4 text-foreground shadow-lg ring-1 ring-black/5 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 min-[520px]:bottom-6 min-[520px]:left-4 min-[520px]:translate-x-0 lg:hidden"
    >
      <SparkleIcon className="size-6 shrink-0 text-primary" />
      <span className="text-base font-medium">Porozmawiaj</span>
    </button>
  );
}
