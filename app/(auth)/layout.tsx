import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-7 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="gradient-primary grid size-16 place-items-center rounded-[1.4rem] shadow-[0_18px_40px_-14px_oklch(0.55_0.26_296/0.9)]">
          <Wallet className="size-7" />
        </span>
        <div>
          <p className="gradient-text text-3xl font-bold tracking-tight">Expenses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every rupee. Understand every month.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm">{children}</div>

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Your data is private to your account and secured by row-level security.
      </p>
    </div>
  );
}
