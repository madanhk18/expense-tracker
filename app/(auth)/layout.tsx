import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Wallet className="size-5" />
        Expenses
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
