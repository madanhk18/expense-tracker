import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  /** One line of context under the title — keep it short. */
  description?: string;
  /** Buttons or controls aligned to the end of the row. */
  actions?: React.ReactNode;
  className?: string;
}

/** The title block every page opens with, so headers line up app-wide. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex w-full flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
