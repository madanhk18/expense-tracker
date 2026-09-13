/** Matches the --chart-1..5 tokens defined in app/globals.css (theme-aware). */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Frosted tooltip so recharts popups match the rest of the UI. */
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--glass-bg-strong)",
    border: "1px solid var(--glass-border)",
    borderRadius: "14px",
    boxShadow: "var(--glass-shadow)",
    backdropFilter: "blur(16px)",
    color: "var(--foreground)",
    fontSize: "12px",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
  itemStyle: { color: "var(--foreground)" },
  cursor: { fill: "var(--muted)", opacity: 0.5 },
} as const;

export const AXIS_STYLE = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
