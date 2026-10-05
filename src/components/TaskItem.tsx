import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Task } from "../types/task";
import { formatTaskDateTime } from "../utils/dateTime";

type TaskItemProps = {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  function renderRightActions() {
    return (
      <Pressable
        style={styles.deleteAction}
        onPress={() => onDelete(task.id)}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </Pressable>
    );
  }

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <View style={styles.taskRow}>
        <Pressable
          style={styles.taskLeft}
          onPress={() => onToggle(task.id)}
        >
          <View style={[styles.circle, task.done && styles.circleDone]}>
            {task.done && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>

          <View style={styles.taskTextGroup}>
            <Text
              style={[styles.taskText, task.done && styles.taskTextDone]}
            >
              {task.text}
            </Text>

            {!task.done && (
              <Text style={styles.taskMeta}>
                {formatTaskDateTime(task.timestamp)}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
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
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    borderRadius: 16,
    marginLeft: 8,
  },
});