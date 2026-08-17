"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={handleLogout}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}
