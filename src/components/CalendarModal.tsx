import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Task } from "../types/task";
import {
  combineDateAndTime,
  formatTimeLabel,
  getTaskStatus,
  isSameDay,
  STATUS_BG_COLORS,
  STATUS_COLORS,
  TaskStatus,
} from "../utils/dateTime";
import DateTimeField from "./DateTimeField";

type CalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  onEditTask: (id: number, text: string, timestamp: number) => void;
  onToggleTask: (id: number) => void;
  onClearMonth: (year: number, month: number) => void;
  // When set (and visible is true), the modal opens straight into the
  // edit screen for this task instead of the month grid — used by
  // TaskItem's swipe-right Edit action.
  openDirectlyForTask?: Task | null;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarModal({
  visible,
  onClose,
  tasks,
  onEditTask,
  onToggleTask,
  onClearMonth,
  openDirectlyForTask,
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Manual keyboard tracking instead of KeyboardAvoidingView: inside a
  // Modal, KeyboardAvoidingView often fails to measure correctly
  // (especially on Android, since Modal opens its own native window), so
  // we shrink the sheet's own max height by the keyboard's height instead
  // and let the ScrollView handle the rest.
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function startEdit(task: Task) {
    setEditingTask(task);
    setEditText(task.text);
    setEditDate(new Date(task.timestamp));
    setEditTime(new Date(task.timestamp));
  }

  // Swipe-right-to-edit entry point: jump straight to the edit screen.
  useEffect(() => {
    if (visible && openDirectlyForTask) {
      startEdit(openDirectlyForTask);
    }
  }, [visible, openDirectlyForTask]);

  function goToPreviousMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) {
          goToNextMonth();
        } else if (gesture.dx > 50) {
          goToPreviousMonth();
        }
      },
    })
  ).current;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (const task of tasks) {
      const d = new Date(task.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(task);
      }
    }
    return map;
  }, [tasks, year, month]);

  function getDayStatuses(day: number): TaskStatus[] {
    const dayTasks = tasksByDay[day] ?? [];
    const active = dayTasks.filter((t) => !t.done);
    const present = new Set(active.map((t) => getTaskStatus(t.timestamp)));
    const order: TaskStatus[] = ["overdue", "soon", "later"];
    return order.filter((s) => present.has(s));
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const tasksForSelectedDay = selectedDay
    ? tasks
        .filter((t) => isSameDay(new Date(t.timestamp), selectedDay))
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  function openDay(day: number) {
    setSelectedDay(new Date(year, month, day));
  }

  function saveEdit() {
    if (!editingTask || !editText.trim()) return;
    onEditTask(
      editingTask.id,
      editText.trim(),
      combineDateAndTime(editDate, editTime)
    );
    setEditingTask(null);
    setSelectedDay(null);
  }

  function toggleEditingTaskDone() {
    if (!editingTask) return;
    onToggleTask(editingTask.id);
    setEditingTask((prev) => (prev ? { ...prev, done: !prev.done } : prev));
  }

  function handleClearMonth() {
    Alert.alert(
      "Clear Month",
      `Delete all tasks in ${monthLabel}? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onClearMonth(year, month),
        },
      ]
    );
  }

  function handleClose() {
    setSelectedDay(null);
    setEditingTask(null);
    onClose();
  }

  const screenHeight = Dimensions.get("window").height;
  const sheetMaxHeight =
    editingTask && keyboardHeight > 0
      ? screenHeight - keyboardHeight - 24
      : screenHeight * 0.85;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
          {editingTask ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editScrollContent}
            >
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setEditingTask(null)} hitSlop={8}>
                  <Ionicons name="chevron-back" size={22} color="#5B4CF0" />
                </Pressable>
                <Text style={styles.sheetTitle}>Edit Task</Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#9CA3AF" />
                </Pressable>
              </View>

              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                placeholder="Task"
                placeholderTextColor="#9CA3AF"
              />

              <DateTimeField
                date={editDate}
                time={editTime}
                onDateChange={setEditDate}
                onTimeChange={setEditTime}
              />

              <Pressable
                style={styles.completeButton}
                onPress={toggleEditingTaskDone}
              >
                <Ionicons
                  name={
                    editingTask.done
                      ? "refresh-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color="#5B4CF0"
                />
                <Text style={styles.completeButtonText}>
                  {editingTask.done ? "Mark Incomplete" : "Mark Completed"}
                </Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </ScrollView>
          ) : selectedDay ? (
            <>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setSelectedDay(null)} hitSlop={8}>
                  <Ionicons name="chevron-back" size={22} color="#5B4CF0" />
                </Pressable>
                <Text style={styles.sheetTitle}>
                  {selectedDay.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#9CA3AF" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.dayTaskList}>
                {tasksForSelectedDay.length === 0 && (
                  <Text style={styles.emptyDayText}>No tasks on this day.</Text>
                )}

                {tasksForSelectedDay.map((task) => (
                  <Pressable
                    key={task.id}
                    style={styles.dayTaskRow}
                    onPress={() => startEdit(task)}
                  >
                    <Text
                      style={[
                        styles.dayTaskText,
                        task.done && styles.dayTaskTextDone,
                      ]}
                      numberOfLines={1}
                    >
                      {task.text}
                    </Text>
                    <Text style={styles.dayTaskTime}>
                      {formatTimeLabel(new Date(task.timestamp))}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <Pressable onPress={goToPreviousMonth} hitSlop={8}>
                  <Ionicons name="chevron-back" size={22} color="#5B4CF0" />
                </Pressable>
                <Text style={styles.sheetTitle}>{monthLabel}</Text>
                <Pressable onPress={goToNextMonth} hitSlop={8}>
                  <Ionicons name="chevron-forward" size={22} color="#5B4CF0" />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, i) => (
                  <Text key={i} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.grid} {...panResponder.panHandlers}>
                {cells.map((day, index) => {
                  if (day === null) {
                    return (
                      <View key={`blank-${index}`} style={styles.dayCell} />
                    );
                  }

                  const statuses = getDayStatuses(day);
                  const bg =
                    statuses.length > 0
                      ? STATUS_BG_COLORS[statuses[0]]
                      : "transparent";

                  return (
                    <Pressable
                      key={day}
                      style={[styles.dayCell, { backgroundColor: bg }]}
                      onPress={() => openDay(day)}
                    >
                      <Text style={styles.dayNumber}>{day}</Text>
                      {statuses.length > 0 && (
                        <View style={styles.dotsRow}>
                          {statuses.map((s) => (
                            <View
                              key={s}
                              style={[
                                styles.dot,
                                { backgroundColor: STATUS_COLORS[s] },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.dot, { backgroundColor: STATUS_COLORS.overdue }]}
                  />
                  <Text style={styles.legendText}>Overdue</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.dot, { backgroundColor: STATUS_COLORS.soon }]}
                  />
                  <Text style={styles.legendText}>Within 7 days</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.dot, { backgroundColor: STATUS_COLORS.later }]}
                  />
                  <Text style={styles.legendText}>Later</Text>
                </View>
              </View>

              <Pressable style={styles.clearButton} onPress={handleClearMonth}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear Month</Text>
              </Pressable>

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31,27,77,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#EEF2FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  editScrollContent: {
    paddingBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    color: "#1F1B4D",
    fontSize: 18,
    fontWeight: "800",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginVertical: 2,
  },
  dayNumber: {
    color: "#1F1B4D",
    fontSize: 14,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendText: {
    color: "#6B7280",
    fontSize: 11,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
  },
  clearButtonText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 14,
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  closeButtonText: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 14,
  },
  dayTaskList: {
    gap: 10,
    paddingBottom: 10,
  },
  emptyDayText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },
  dayTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayTaskText: {
    flex: 1,
    color: "#1F1B4D",
    fontSize: 15,
    fontWeight: "600",
    marginRight: 10,
  },
  dayTaskTextDone: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  dayTaskTime: {
    color: "#6B7280",
    fontSize: 13,
  },
  editInput: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F1B4D",
    marginBottom: 12,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E0E7FF",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  completeButtonText: {
    color: "#5B4CF0",
    fontWeight: "700",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#5B4CF0",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 16,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});