import {
  format,
  formatISO,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";

/** All range helpers operate on the browser's local timezone (the user's device tz). */

export function todayRange(ref: Date = new Date()) {
  return { start: startOfDay(ref), end: endOfDay(ref) };
}

export function thisWeekRange(ref: Date = new Date()) {
  return {
    start: startOfWeek(ref, { weekStartsOn: 1 }),
    end: endOfWeek(ref, { weekStartsOn: 1 }),
  };
}

export function monthRange(ref: Date = new Date()) {
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
}

export function previousMonthRange(ref: Date = new Date()) {
  const prev = subMonths(ref, 1);
  return monthRange(prev);
}

/** Group label for the expense-history list: "Today" / "Yesterday" / formatted date. */
export function groupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMMM yyyy");
}

export function toISODate(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export function fromISO(value: string): Date {
  return parseISO(value);
}

/** Format a date+time for display, respecting the user's preferred date format. */
export function formatDateTime(date: Date, dateFormat = "dd/MM/yyyy"): string {
  return format(date, `${dateFormat} 'at' h:mm a`);
}

export function formatDate(date: Date, dateFormat = "dd/MM/yyyy"): string {
  return format(date, dateFormat);
}

export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

export function monthLabel(date: Date): string {
  return format(date, "MMMM yyyy");
}

/** Calendar-day distance from `ref` to `date`. Negative means `date` is in the past (overdue). */
export function daysUntil(date: Date, ref: Date = new Date()): number {
  return differenceInCalendarDays(date, ref);
}

/**
 * Normalise a user-picked custom range (two yyyy-MM-dd strings) into a real
 * instant range. The end date is pushed to the end of that day — otherwise a
 * range ending "13 Sep" would exclude everything spent on 13 Sep — and a
 * backwards range is swapped rather than returning nothing.
 *
 * Returns null when either date is missing or unparseable.
 */
export function customRange(from?: string, to?: string): { start: Date; end: Date } | null {
  if (!from || !to) return null;

  const a = parseISO(from);
  const b = parseISO(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;

  const [first, last] = a <= b ? [a, b] : [b, a];
  return { start: startOfDay(first), end: endOfDay(last) };
}

/** The window of the same length immediately before `start`. */
export function precedingRange(start: Date, end: Date): { start: Date; end: Date } {
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  return { start: new Date(prevEnd.getTime() - span), end: prevEnd };
}

/** "10 Aug – 13 Sep 2026" — years collapse when both dates share one. */
export function rangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}

/** Inclusive number of calendar days covered by a range. */
export function rangeDays(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}
