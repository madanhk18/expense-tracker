import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Ink band at the top carries the brand; the form sits on the light page. */}
      <header className="bg-primary px-6 pt-12 pb-16 text-primary-foreground">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-4">
          <div>
            <p className="font-heading text-3xl leading-none font-bold tracking-tight">Expenses</p>
            <p className="mt-2 text-sm opacity-70">Track every rupee.</p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/10">
            <Wallet className="size-7" />
          </span>
        </div>
      </header>

      <main className="-mt-8 flex-1 px-5 pb-10">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
