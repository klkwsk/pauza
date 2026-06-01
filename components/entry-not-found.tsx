import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EntryNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        className="-ml-2 h-9 self-start"
        render={<Link href="/" />}
        nativeButton={false}
      >
        <ArrowLeft />
        Wszystkie wpisy
      </Button>
      <Card className="items-center gap-2 px-6 py-14 text-center">
        <p className="text-base font-medium">Nie znaleziono wpisu</p>
        <p className="text-sm text-muted-foreground">
          Ten wpis nie istnieje lub został usunięty.
        </p>
      </Card>
    </div>
  );
}
