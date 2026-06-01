import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntryForm } from "@/components/entry-form";

export default function NewEntryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          className="-ml-2 h-9"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ArrowLeft />
          Wszystkie wpisy
        </Button>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          Nowy wpis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zatrzymaj się na chwilę i zapisz, co czujesz.
        </p>
      </div>
      <EntryForm />
    </div>
  );
}
