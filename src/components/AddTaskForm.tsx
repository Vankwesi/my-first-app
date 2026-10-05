import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { combineDateAndTime } from "../utils/dateTime";
import DateTimeField from "./DateTimeField";

type AddTaskFormProps = {
  onAdd: (text: string, timestamp: number) => void;
};

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  function handleAdd() {
    if (!text.trim()) return;

    onAdd(text.trim(), combineDateAndTime(selectedDate, selectedTime));

    setText("");
    setSelectedDate(new Date());
    setSelectedTime(new Date());
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputCard}>
        <Ionicons name="pencil" size={18} color="#9CA3AF" />

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a task..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />

        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      <DateTimeField
        date={selectedDate}
        time={selectedTime}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        minimumDate={new Date()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
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
});