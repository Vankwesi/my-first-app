import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types/task";

const TASKS_KEY = "my-tasks:tasks";

export async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Non-critical — the in-memory task list still works this session.
  }
}