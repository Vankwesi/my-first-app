export type TaskStatus = "overdue" | "soon" | "later";

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_WINDOW_MS = 7 * DAY_MS;

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function combineDateAndTime(date: Date, time: Date): number {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.getTime();
}

export function formatDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTaskDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${formatDateLabel(date)} • ${formatTimeLabel(date)}`;
}

export function getTaskStatus(timestamp: number): TaskStatus {
  const now = Date.now();
  if (timestamp < now) return "overdue";
  if (timestamp <= now + SOON_WINDOW_MS) return "soon";
  return "later";
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  overdue: "#DC2626",
  soon: "#D97706",
  later: "#6B7280",
};

export const STATUS_BG_COLORS: Record<TaskStatus, string> = {
  overdue: "#FCA5A5",
  soon: "#FCD34D",
  later: "#D1D5DB",
};