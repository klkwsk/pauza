// Współdzielone, bezstanowe elementy dokumentacji (zakładki API i MCP).
// Server components — bez interakcji.

export function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border bg-card p-4 font-mono text-[0.8rem] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-heading text-2xl font-medium tracking-tight">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}
