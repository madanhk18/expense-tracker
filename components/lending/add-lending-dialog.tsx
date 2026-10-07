"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LendingForm } from "./lending-form";
import type { LendingDirection } from "@/lib/constants";

interface AddLendingDialogProps {
  people: string[];
  defaultPerson?: string;
  defaultDirection?: LendingDirection;
  trigger?: React.ReactNode;
}

export function AddLendingDialog({ people, defaultPerson, defaultDirection, trigger }: AddLendingDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 size-4" />
            Gave or took money
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{defaultPerson ? `New entry with ${defaultPerson}` : "Gave or took money"}</DialogTitle>
          </DialogHeader>
          <LendingForm
            people={people}
            defaultPerson={defaultPerson}
            defaultDirection={defaultDirection}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
