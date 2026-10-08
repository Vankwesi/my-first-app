import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Task } from "../types/task";
import { formatTimeLabel } from "./dateTime";

const ONE_MIN_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// How many future daily "missed task" reminders to pre-schedule at once.
// Local notifications can't be chained by a timer while the app is closed,
// so instead of one infinite repeating reminder we schedule this many
// individual future reminders up front (see note #10 in the report).
const OVERDUE_REPEAT_DAYS = 30;

const NOTIFICATION_MAP_KEY = "my-tasks:notification-map";
const MISSED_TASK_CATEGORY = "missed-task";

export const MARK_DONE_ACTION = "MARK_DONE";
export const OKAY_ACTION = "OKAY";

type NotificationMap = Record<string, string[]>; // taskId -> notification IDs

async function getMap(): Promise<NotificationMap> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setMap(map: NotificationMap): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
  } catch {
    // non-critical
  }
}

/**
 * Configure how notifications behave while the app is running, and
 * register the "missed task" interactive category (Mark Done / Okay).
 * Call once, as early as possible at startup.
 */
export async function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Task reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  await Notifications.setNotificationCategoryAsync(MISSED_TASK_CATEGORY, [
    {
      identifier: MARK_DONE_ACTION,
      buttonTitle: "Mark Done",
      // Must open the app: there's no backend/push task-runner here, so
      // this is the only reliable way to run the JS that updates storage
      // and cancels notifications when the app isn't already running.
      options: { opensAppToForeground: true },
    },
    {
      identifier: OKAY_ACTION,
      buttonTitle: "Okay",
      options: { opensAppToForeground: true },
    },
  ]);
}

/**
 * Requests notification permission only if not already decided. Safe to
 * call on every app start — never re-prompts once granted or denied.
 */
export async function ensurePermissions(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

function buildReminderPlan(task: Task) {
  const due = task.timestamp;
  const dueTimeLabel = formatTimeLabel(new Date(due));

  return [
    {
      kind: "dayBefore",
      triggerAt: due - ONE_DAY_MS,
      title: "📅 Task tomorrow",
      body: `${task.text} — Tomorrow at ${dueTimeLabel}`,
    },
    {
      kind: "min30",
      triggerAt: due - 30 * ONE_MIN_MS,
      title: "⏰ Coming up soon",
      body: `${task.text} — 30 minutes left`,
    },
    {
      kind: "min15",
      triggerAt: due - 15 * ONE_MIN_MS,
      title: "⏰ Starting soon",
      body: `${task.text} — 15 minutes left`,
    },
    {
      kind: "dueNow",
      triggerAt: due,
      title: "🔔 Task due now",
      body: `${task.text} — ${dueTimeLabel}`,
    },
  ];
}

/**
 * Schedules every still-future reminder for a task: the 1-day / 30-min /
 * 15-min / due-now reminders, plus a bounded chain of daily "missed task"
 * reminders starting 24h after the due time. Only trigger times still in
 * the future are scheduled. Resulting notification IDs are stored so they
 * can be found again later for cancelling.
 */
export async function scheduleTaskNotifications(task: Task): Promise<void> {
  if (task.done) return;

  const granted = await ensurePermissions();
  if (!granted) return;

  const now = Date.now();
  const ids: string[] = [];
  const dueTimeLabel = formatTimeLabel(new Date(task.timestamp));

  for (const reminder of buildReminderPlan(task)) {
    if (reminder.triggerAt <= now) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { taskId: task.id, kind: reminder.kind },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.triggerAt),
      },
    });
    ids.push(id);
  }

  for (let day = 1; day <= OVERDUE_REPEAT_DAYS; day++) {
    const triggerAt = task.timestamp + day * ONE_DAY_MS;
    if (triggerAt <= now) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Missed task",
        body: `${task.text} was due at ${dueTimeLabel}.`,
        categoryIdentifier: MISSED_TASK_CATEGORY,
        data: { taskId: task.id, kind: "overdue" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerAt),
      },
    });
    ids.push(id);
  }

  const map = await getMap();
  map[String(task.id)] = ids;
  await setMap(map);
}

/** Cancels every scheduled notification previously recorded for a task. */
export async function cancelTaskNotifications(taskId: number): Promise<void> {
  const map = await getMap();
  const ids = map[String(taskId)];
  if (ids && ids.length > 0) {
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
    );
  }
  delete map[String(taskId)];
  await setMap(map);
}

/** Used by "Okay" — same mechanism as a full cancel (see note #10). */
export async function cancelOverdueNotifications(taskId: number): Promise<void> {
  await cancelTaskNotifications(taskId);
}

/** Cancel + reschedule — used whenever a task's text/date/time is edited. */
export async function rescheduleTaskNotifications(task: Task): Promise<void> {
  await cancelTaskNotifications(task.id);
  await scheduleTaskNotifications(task);
}

/**
 * Call once at startup, after tasks are loaded from storage. Fills in
 * notifications for any incomplete task that doesn't already have some
 * tracked (never re-schedules — and therefore never duplicates — a task
 * that already has notifications), cancels notifications for completed
 * tasks that still have some tracked, and removes orphaned entries left
 * over from deleted tasks.
 */
export async function reconcileNotifications(tasks: Task[]): Promise<void> {
  const map = await getMap();
  const taskIds = new Set(tasks.map((t) => String(t.id)));

  for (const key of Object.keys(map)) {
    if (!taskIds.has(key)) {
      await Promise.all(
        map[key].map((id) => Notifications.cancelScheduledNotificationAsync(id))
      );
      delete map[key];
    }
  }
  await setMap(map);

  for (const task of tasks) {
    const hasScheduled = (map[String(task.id)] ?? []).length > 0;
    if (task.done) {
      if (hasScheduled) await cancelTaskNotifications(task.id);
      continue;
    }
    if (!hasScheduled) {
      await scheduleTaskNotifications(task);
    }
  }
}

export type NotificationActionResult =
  | { type: "markDone"; taskId: number }
  | { type: "okay"; taskId: number }
  | null;

/** Pulls the task ID + intended action out of a notification response. */
export function interpretResponse(
  response: Notifications.NotificationResponse
): NotificationActionResult {
  const data = response.notification.request.content.data as
    | { taskId?: number }
    | undefined;
  const taskId = data?.taskId;
  if (typeof taskId !== "number") return null;

  if (response.actionIdentifier === MARK_DONE_ACTION) {
    return { type: "markDone", taskId };
  }
  if (response.actionIdentifier === OKAY_ACTION) {
    return { type: "okay", taskId };
  }
  return null;
}