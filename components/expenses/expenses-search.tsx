"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The magnifier in the header: opens a single search field. */
export function ExpensesSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) params.set("q", term.trim());
    else params.delete("q");
    params.delete("page");
    setOpen(false);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const active = searchParams.has("q");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search expenses">
          <Search className={active ? "size-4 text-foreground" : "size-4 text-muted-foreground"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={submit} className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Item, merchant or note…"
            className="pl-10"
          />
        </form>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTerm("");
              const params = new URLSearchParams(searchParams.toString());
              params.delete("q");
              setOpen(false);
              router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
            }}
          >
            <X className="mr-1 size-3.5" /> Clear search
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
