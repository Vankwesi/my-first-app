import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Task = {
  id: number;
  text: string;
  done: boolean;
};

export default function HomeScreen() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  function addTask() {
    if (!task.trim()) return;

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: task.trim(),
        done: false,
      },
    ]);

    setTask("");
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

      <View style={styles.inputCard}>
        <Ionicons name="pencil" size={18} color="#9CA3AF" />

        <TextInput
          style={styles.input}
          value={task}
          onChangeText={setTask}
          placeholder="Type a task..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={addTask}
          returnKeyType="done"
        />

        <Pressable style={styles.addButton} onPress={addTask}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

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

              <Text style={[styles.taskText, item.done && styles.taskTextDone]}>
                {item.text}
              </Text>
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

  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 10,
    shadowColor: "#5B4CF0",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1F1B4D",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#5B4CF0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },

  addText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
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

  taskText: {
    flex: 1,
    color: "#1F1B4D",
    fontSize: 16,
    fontWeight: "700",
  },

  taskTextDone: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
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