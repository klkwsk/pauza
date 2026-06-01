"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoodFace } from "@/components/mood-faces";
import { useProfile } from "@/hooks/use-profile";

export default function WelcomePage() {
  const router = useRouter();
  const { name: savedName, loading, setName } = useProfile();
  const [value, setValue] = useState("");

  // Jeśli imię już jest podane, onboarding jest niepotrzebny — wróć na listę.
  useEffect(() => {
    if (!loading && savedName) router.replace("/");
  }, [loading, savedName, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setName(trimmed);
    router.replace("/");
  }

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Cześć
          </h1>
          <p className="text-base text-muted-foreground">
            Pauza to twoje miejsce do zapisu codziennych refleksji.
          </p>
        </header>

        <MoodFace mood={5} className="w-[150px] text-primary" />

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <Label htmlFor="name" className="text-base">
            Jak masz na imię?
          </Label>
          <div className="flex w-[20ch] flex-col gap-4">
            <Input
              id="name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Twoje imię…"
              autoFocus
              autoComplete="given-name"
              maxLength={20}
              className="h-11 text-center"
            />
            <Button
              type="submit"
              disabled={!value.trim()}
              className="h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
            >
              Zaczynamy
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
