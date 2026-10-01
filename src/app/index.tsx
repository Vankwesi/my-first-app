import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddTaskForm from "../components/AddTaskForm";

type Task = {
  id: number;
  text: string;
  date: string;
  time: string;
  done: boolean;
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  function addTask(text: string, date: string, time: string) {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text,
        date,
        time,
        done: false,
      },
    ]);
  }

  function toggleTask(id: number) {
    setTasks(
      tasks.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }

  function deleteTask(id: number) {
    setTasks(tasks.filter((item) => item.id !== id));
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sun}>🌞</Text>

      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="checkbox-outline" size={28} color="#5B4CF0" />
        </View>
        <Text style={styles.title}>My Tasks</Text>
      </View>

      <Text style={styles.subtitle}>Stay organized and get things done!</Text>

      <AddTaskForm onAdd={addTask} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {tasks.map((item) => (
          <View key={item.id} style={styles.taskRow}>
            <Pressable
              style={styles.taskLeft}
              onPress={() => toggleTask(item.id)}
            >
              <View style={[styles.circle, item.done && styles.circleDone]}>
                {item.done && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>

              <View style={styles.taskTextGroup}>
                <Text
                  style={[styles.taskText, item.done && styles.taskTextDone]}
                >
                  {item.text}
                </Text>
                <Text style={styles.taskMeta}>
                  {item.date} • {item.time}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteTask(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          </View>
        ))}

        {tasks.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Add a task to get started!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sun: {
    position: "absolute",
    top: 50,
    right: 24,
    fontSize: 44,
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
    fontSize: 34,
    fontWeight: "800",
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

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#5B4CF0",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  taskLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },

  circleDone: {
    backgroundColor: "#5B4CF0",
    borderColor: "#5B4CF0",
  },

  taskTextGroup: {
    flex: 1,
  },

  taskText: {
    color: "#1F1B4D",
    fontSize: 16,
    fontWeight: "700",
  },

  taskTextDone: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  taskMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
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