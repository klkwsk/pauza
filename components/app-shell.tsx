"use client";

import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";
import { ChatProvider } from "@/components/chat-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Bez nawigacji w formularzu wpisu (nowy/edycja) i na ekranie logowania.
  const hideChrome =
    pathname === "/new" ||
    pathname.endsWith("/edit") ||
    pathname === "/login";

  return (
    <ChatProvider showDock={!hideChrome}>
      {!hideChrome && <SidebarNav />}
      {/* Na desktopie odsuwamy treść od stałego paska bocznego */}
      <div className={hideChrome ? undefined : "lg:pl-64"}>{children}</div>
      <BottomNav />
    </ChatProvider>
  );
}
