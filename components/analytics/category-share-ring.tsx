import { categoryStyle } from "@/lib/category-style";

/**
 * A single-category ring: the filled arc is that category's share of the
 * month, drawn as a stroked circle rather than a chart library.
 */
export function CategoryShareRing({
  name,
  icon,
  color,
  percent,
  label,
}: {
  name: string;
  icon?: string | null;
  color: string;
  percent: number;
  label: string;
}) {
  const Icon = categoryStyle(name, icon).icon;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <div className="relative mx-auto grid size-40 place-items-center">
      <svg viewBox="0 0 140 140" className="size-40 -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--muted)" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="grid size-12 place-items-center rounded-full" style={{ backgroundColor: color }}>
          <Icon className="size-6 text-white" strokeWidth={2} />
        </span>
        <span className="mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  );
}
