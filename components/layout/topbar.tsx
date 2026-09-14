"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";

export function Topbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/expenses?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-6">
      <div className="surface-raised mx-auto flex h-14 w-full max-w-6xl items-center gap-3 rounded-xl px-3">
        <div className="flex items-center gap-2 md:hidden">
          <span className="btn-solid grid size-9 place-items-center rounded-xl">
            <Wallet className="size-4.5" />
          </span>
        </div>
        <form onSubmit={handleSearch} className="relative w-full max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="h-10 rounded-full pl-9"
          />
        </form>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton iconOnly />
        </div>
      </div>
    </header>
  );
}
