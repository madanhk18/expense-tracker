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
