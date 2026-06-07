"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useExpertChat } from "@/hooks/use-expert-chat";
import { AiChatSheet, type ChatMessage } from "@/components/ai-chat-sheet";

// Globalny stan rozmowy z Ekspertem. Wyniesiony ponad strony i pasek boczny,
// bo trigger („Porozmawiaj") żyje w pasku bocznym, a wybrany dzień — na stronie głównej.
type ChatContextValue = {
  selectedDate: string | null;
  setSelectedDate: Dispatch<SetStateAction<string | null>>;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  sending: boolean;
  openChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat musi być użyte wewnątrz <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, sending } = useExpertChat(selectedDate);

  // Auto-otwieranie na desktopie, gdy wybrany dzień ma już historię rozmowy —
  // raz na dany dzień (ręczne zamknięcie nie odpala go ponownie dla tego samego dnia).
  const autoOpenedForDay = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedDate) {
      autoOpenedForDay.current = null;
      return;
    }
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (
      isDesktop &&
      messages.length > 0 &&
      autoOpenedForDay.current !== selectedDate
    ) {
      autoOpenedForDay.current = selectedDate;
      setOpen(true);
    }
  }, [selectedDate, messages]);

  return (
    <ChatContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        messages,
        sendMessage,
        sending,
        openChat: () => setOpen(true),
      }}
    >
      {children}
      <AiChatSheet
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        onSend={sendMessage}
      />
    </ChatContext.Provider>
  );
}
