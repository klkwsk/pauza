"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || !password) return;
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { data: { full_name: name.trim() || undefined } },
        });
        if (error) throw error;
        // Bez potwierdzania e-mail: signUp od razu zwraca sesję → na listę.
        if (data.session) {
          router.replace("/");
          return;
        }
        // Gdyby potwierdzanie było jednak włączone w panelu Supabase.
        toast.message("Potwierdź konto przez link wysłany na e-mail.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: mail,
          password,
        });
        if (error) throw error;
        router.replace("/");
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        isSignup
          ? "Nie udało się założyć konta. " + message
          : "Błędny e-mail lub hasło.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-4 pt-8 pb-28 text-center">
      <div className="flex w-[26ch] max-w-full flex-col items-center gap-8">
        <header className="flex flex-col gap-3">
          <h1
            className="font-medium leading-none tracking-tight uppercase"
            style={{ fontFamily: "var(--font-chewy)", fontSize: "65px" }}
          >
            Pauza
          </h1>
          <p className="text-base text-muted-foreground">
            {isSignup
              ? "Załóż konto, aby zacząć zapisywać refleksje."
              : "Zaloguj się, aby wrócić do swoich wpisów."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4 text-left"
        >
          {isSignup && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Imię</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Twoje imię (opcjonalnie)"
                autoComplete="given-name"
                maxLength={40}
                className="h-11"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@przyklad.pl"
              autoComplete="email"
              required
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              required
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-2 h-11"
          >
            {loading
              ? "Chwila…"
              : isSignup
                ? "Załóż konto"
                : "Zaloguj się"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(isSignup ? "signin" : "signup")}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {isSignup
            ? "Masz już konto? Zaloguj się"
            : "Nie masz konta? Załóż je"}
        </button>
      </div>
    </main>
  );
}
