import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddTaskForm from "../components/AddTaskForm";
import CalendarModal from "../components/CalendarModal";
import TaskItem from "../components/TaskItem";
import { Task } from "../types/task";
import {
  cancelOverdueNotifications,
  cancelTaskNotifications,
  configureNotifications,
  ensurePermissions,
  interpretResponse,
  reconcileNotifications,
  rescheduleTaskNotifications,
  scheduleTaskNotifications,
} from "../utils/notifications";
import { loadTasks, saveTasks } from "../utils/storage";

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const tasksRef = useRef<Task[]>(tasks);
  const hasLoadedRef = useRef(false);

  tasksRef.current = tasks;

  // Display-only ordering. `tasks` itself (and storage) keeps plain
  // insertion order always — this is purely derived for rendering.
  //
  // Incomplete tasks are sorted soonest-due-first among themselves, but
  // each completed task stays pinned at its own original position in the
  // list rather than jumping anywhere — completing a task should not
  // visibly move it.
  const sortedTasks = useMemo(() => {
    const incompleteSorted = tasks
      .filter((t) => !t.done)
      .sort((a, b) => a.timestamp - b.timestamp);

    let incompleteIndex = 0;
    return tasks.map((t) =>
      t.done ? t : incompleteSorted[incompleteIndex++]
    );
  }, [tasks]);

  async function handleResponse(response: Notifications.NotificationResponse) {
    const action = interpretResponse(response);
    if (!action) return;

    if (action.type === "markDone") {
      setTasks((current) =>
        current.map((item) =>
          item.id === action.taskId ? { ...item, done: true } : item
        )
      );
      await cancelTaskNotifications(action.taskId);
    } else if (action.type === "okay") {
      await cancelOverdueNotifications(action.taskId);
    }
  }

  // Startup: configure notifications, load persisted tasks, make sure
  // every task has the notifications it should, and handle any
  // Mark Done / Okay action that was pressed while the app was closed.
  useEffect(() => {
    let isMounted = true;

    async function init() {
      await configureNotifications();
      await ensurePermissions();

      const stored = await loadTasks();
      if (!isMounted) return;
      setTasks(stored);
      hasLoadedRef.current = true;

      await reconcileNotifications(stored);

      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        await handleResponse(lastResponse);
        await Notifications.clearLastNotificationResponseAsync();
      }
    }

    init();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  // Persist tasks to storage whenever they change (skipped until the
  // initial load above has actually happened, so we don't overwrite
  // stored tasks with an empty list while loading).
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveTasks(tasks);
  }, [tasks]);

  function addTask(text: string, timestamp: number) {
    const newTask: Task = { id: Date.now(), text, timestamp, done: false };
    setTasks((current) => [...current, newTask]);
    scheduleTaskNotifications(newTask);
  }

  function toggleTask(id: number) {
    const current = tasksRef.current.find((item) => item.id === id);

    setTasks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );

    if (!current) return;
    if (!current.done) {
      // was incomplete, now being marked done
      cancelTaskNotifications(id);
    } else {
      // was done, now reopened — reschedule future reminders
      scheduleTaskNotifications({ ...current, done: false });
    }
  }

  function deleteTask(id: number) {
    setTasks((current) => current.filter((item) => item.id !== id));
    cancelTaskNotifications(id);
  }

  function editTask(id: number, text: string, timestamp: number) {
    let updated: Task | undefined;

    setTasks((current) =>
      current.map((item) => {
        if (item.id === id) {
          updated = { ...item, text, timestamp };
          return updated;
        }
        return item;
      })
    );

    if (updated) {
      rescheduleTaskNotifications(updated);
    }
  }

  function clearMonth(year: number, month: number) {
    const toDelete = tasks.filter((item) => {
      const d = new Date(item.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    setTasks((current) =>
      current.filter((item) => {
        const d = new Date(item.timestamp);
        return !(d.getFullYear() === year && d.getMonth() === month);
      })
    );

    toDelete.forEach((item) => cancelTaskNotifications(item.id));
  }

  function openEditForTask(task: Task) {
    setEditTarget(task);
    setCalendarVisible(true);
  }

  function closeCalendar() {
    setCalendarVisible(false);
    setEditTarget(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="checkbox-outline" size={28} color="#5B4CF0" />
        </View>
        <Text style={styles.title}>𝔒ray’s{"\n"}      𝔇esk</Text>



        <Pressable
          style={styles.calendarButton}
          onPress={() => setCalendarVisible(true)}
        >
          <Ionicons name="calendar" size={22} color="#5B4CF0" />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Stay organized and get things done!</Text>

      <AddTaskForm onAdd={addTask} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedTasks.map((item) => (
          <TaskItem
            key={item.id}
            task={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={openEditForTask}
          />
        ))}

        {sortedTasks.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Add a task to get started!</Text>
          </View>
        )}
      </ScrollView>

      <CalendarModal
        visible={calendarVisible}
        onClose={closeCalendar}
        tasks={tasks}
        onEditTask={editTask}
        onToggleTask={toggleTask}
        onClearMonth={clearMonth}
        openDirectlyForTask={editTarget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#1F1B4D",
    fontSize: 35,
    fontWeight: "800",
    lineHeight: 30,
  },
  calendarButton: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
  },
  list: {
    marginTop: 20,
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#1F1B4D",
    fontSize: 18,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
});