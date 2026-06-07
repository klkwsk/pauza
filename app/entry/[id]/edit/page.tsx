"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntryForm } from "@/components/entry-form";
import { EntryNotFound } from "@/components/entry-not-found";
import { useEntry } from "@/hooks/use-entries";

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const { entry, loading } = useEntry(id);

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">Ładowanie…</p>
    );
  }

  if (!entry) {
    return <EntryNotFound />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-28 sm:pt-12">
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
        <h1 className="mt-2 font-heading text-2xl font-medium tracking-tight">
          Edytuj wpis
        </h1>
      </div>
      <EntryForm entry={entry} />
    </div>
  );
}
