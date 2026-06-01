"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DeleteEntryDialogProps = {
  onConfirm: () => void;
  triggerLabel?: string;
};

export function DeleteEntryDialog({
  onConfirm,
  triggerLabel = "Usuń wpis",
}: DeleteEntryDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" className="h-10" />}
      >
        <Trash2 />
        {triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <TrashIcon className="size-8 text-muted-foreground" />
          <AlertDialogTitle>Usunąć wpis?</AlertDialogTitle>
          <AlertDialogDescription>
            Tej operacji nie można cofnąć. Wpis zostanie trwale usunięty.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={onConfirm}
          >
            Usuń wpis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
