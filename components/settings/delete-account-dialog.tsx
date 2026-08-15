"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toFriendlyMessage, logError } from "@/lib/errors";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountDialog({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      logError("delete-account", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete your account. Please try again."));
      setDeleting(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and <strong>all your expense data</strong> — this cannot be
              undone. Type <strong>{CONFIRM_TEXT}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmation</Label>
            <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={CONFIRM_TEXT} />
          </div>
          <Button
            variant="destructive"
            disabled={confirmText !== CONFIRM_TEXT || deleting}
            onClick={handleDelete}
            className="w-full"
          >
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
