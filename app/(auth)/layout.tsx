import { Wallet } from "lucide-react";

/**
 * A drawn header rather than a plain block: concentric rings behind the mark,
 * the wordmark under it, then the form card on the page below.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="relative overflow-hidden bg-primary px-6 pt-14 pb-20 text-primary-foreground">
        {/* Decorative rings — purely visual, hidden from assistive tech. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-64 rounded-full border border-primary-foreground/10" />
          <div className="absolute -top-10 -right-4 size-40 rounded-full border border-primary-foreground/10" />
          <div className="absolute -bottom-28 -left-16 size-56 rounded-full border border-primary-foreground/10" />
        </div>

        <div className="relative mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary-foreground text-primary">
            <Wallet className="size-8" />
          </span>
          <p className="mt-4 font-heading text-3xl leading-none font-bold tracking-tight">Expenses</p>
          <p className="mt-2 text-sm opacity-70">Track every rupee. Understand every month.</p>
        </div>
      </header>

      <main className="-mt-10 flex-1 px-5 pb-10">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
