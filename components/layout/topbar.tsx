"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/expenses?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2 font-semibold md:hidden">
        <Wallet className="size-5" />
      </div>
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses…"
          className="pl-8"
        />
      </form>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
