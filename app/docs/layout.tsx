import { DocsTopBar } from "@/components/docs-top-bar";

// Wspólny layout dokumentacji: górny pasek (zakładki API/MCP + generator tokenu)
// jest współdzielony przez obie zakładki i NIE remontuje się przy nawigacji
// między /docs a /docs/mcp — dzięki temu stan generatora kluczy się utrzymuje.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <DocsTopBar />
      {children}
    </div>
  );
}
