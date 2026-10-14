import { eachDayOfInterval, endOfMonth, format, getDay, isAfter, startOfDay, startOfMonth } from "date-fns";

/**
 * Day-level spending behaviour for one month — the things the Analytics page
 * doesn't show: which days you spend, how many days you didn't, how much the
 * small stuff adds up to, and where the month is heading. Pure — no I/O.
 */

export interface InsightRow {
  amount_paise: number;
  expense_at: string;
  description: string;
  category: { name: string; icon: string | null } | null;
}

export interface CalendarDay {
  date: string; // yyyy-MM-dd
  day: number;
  paise: number;
  count: number;
  /** 0–4: how heavy the day was relative to the month's busiest day. */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

export interface ExpenseInsights {
  totalPaise: number;
  count: number;
  daysElapsed: number;
  daysInMonth: number;
  /** Leading empty cells so the calendar starts on Monday. */
  calendarOffset: number;
  calendar: CalendarDay[];
  /** Cumulative spend per day so far, for the sparkline. */
  cumulative: number[];
  weekdays: { label: string; paise: number }[];
  busiestWeekday: string | null;
  noSpendDays: number;
  /** Consecutive no-spend days ending today (current month only). */
  noSpendStreak: number;
  smallSpends: { thresholdPaise: number; paise: number; count: number };
  biggest: InsightRow[];
  /** Month-end estimate at the current daily pace; null for past months. */
  projectedPaise: number | null;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SMALL_SPEND_PAISE = 200_00; // under ₹200

export function buildExpenseInsights(rows: InsightRow[], monthRef: Date, now = new Date()): ExpenseInsights {
  const start = startOfMonth(monthRef);
  const end = endOfMonth(monthRef);
  const today = startOfDay(now);
  const isCurrentMonth = format(start, "yyyy-MM") === format(today, "yyyy-MM");
  const isFutureMonth = isAfter(start, today);

  const byDay = new Map<string, { paise: number; count: number }>();
  const weekdayPaise = new Array(7).fill(0) as number[];
  let totalPaise = 0;
  let smallPaise = 0;
  let smallCount = 0;

  for (const row of rows) {
    const at = new Date(row.expense_at);
    const key = format(at, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { paise: 0, count: 0 };
    entry.paise += row.amount_paise;
    entry.count += 1;
    byDay.set(key, entry);
    weekdayPaise[(getDay(at) + 6) % 7] += row.amount_paise; // Monday-first
    totalPaise += row.amount_paise;
    if (row.amount_paise < SMALL_SPEND_PAISE) {
      smallPaise += row.amount_paise;
      smallCount += 1;
    }
  }

  const days = eachDayOfInterval({ start, end });
  const maxDay = Math.max(1, ...[...byDay.values()].map((d) => d.paise));
  const calendar: CalendarDay[] = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const entry = byDay.get(key);
    const paise = entry?.paise ?? 0;
    const ratio = paise / maxDay;
    return {
      date: key,
      day: d.getDate(),
      paise,
      count: entry?.count ?? 0,
      level: paise === 0 ? 0 : ratio > 0.66 ? 4 : ratio > 0.33 ? 3 : ratio > 0.12 ? 2 : 1,
      future: isAfter(d, today),
    };
  });

  const elapsed = isFutureMonth ? [] : calendar.filter((d) => !d.future);
  const daysElapsed = elapsed.length;

  let running = 0;
  const cumulative = elapsed.map((d) => (running += d.paise));

  let noSpendStreak = 0;
  if (isCurrentMonth) {
    for (let i = elapsed.length - 1; i >= 0 && elapsed[i]!.paise === 0; i--) noSpendStreak++;
  }

  const weekdays = WEEKDAYS.map((label, i) => ({ label, paise: weekdayPaise[i]! }));
  const busiest = weekdays.reduce((a, b) => (b.paise > a.paise ? b : a), weekdays[0]!);

  return {
    totalPaise,
    count: rows.length,
    daysElapsed,
    daysInMonth: days.length,
    calendarOffset: (getDay(start) + 6) % 7,
    calendar,
    cumulative,
    weekdays,
    busiestWeekday: busiest.paise > 0 ? busiest.label : null,
    noSpendDays: elapsed.filter((d) => d.paise === 0).length,
    noSpendStreak,
    smallSpends: { thresholdPaise: SMALL_SPEND_PAISE, paise: smallPaise, count: smallCount },
    biggest: [...rows].sort((a, b) => b.amount_paise - a.amount_paise).slice(0, 3),
    projectedPaise:
      isCurrentMonth && daysElapsed > 0 ? Math.round((totalPaise / daysElapsed) * days.length) : null,
  };
}
