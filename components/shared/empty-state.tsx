import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/60 bg-white/30 py-14 text-center backdrop-blur-sm dark:border-white/12 dark:bg-white/5",
        className
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl border border-white/60 bg-[image:var(--gradient-primary)] opacity-90 dark:border-white/12">
        <Icon className="size-6 text-white" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
