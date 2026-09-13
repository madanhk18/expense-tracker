import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2.5 text-lg font-semibold">
        <span className="gradient-primary grid size-10 place-items-center rounded-2xl">
          <Wallet className="size-5" />
        </span>
        <span className="gradient-text text-xl font-bold tracking-tight">Expenses</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
