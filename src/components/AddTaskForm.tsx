import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type AddTaskFormProps = {
  onAdd: (text: string, date: string, time: string) => void;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateLabel(date: Date) {
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

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function handleAdd() {
    if (!text.trim()) return;

    onAdd(
      text.trim(),
      formatDateLabel(selectedDate),
      formatTimeLabel(selectedTime)
    );

    setText("");
    setSelectedDate(new Date());
    setSelectedTime(new Date());
  }

  function selectToday() {
    setSelectedDate(new Date());
    setDateMenuVisible(false);
  }

  function selectTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setDateMenuVisible(false);
  }

  function openDatePicker() {
    setDateMenuVisible(false);
    setShowDatePicker(true);
  }

  function onDateChange(event: DateTimePickerEvent, date?: Date) {
    // Android closes the picker itself after a selection; iOS keeps it open
    // inline, so we only auto-close on Android.
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && date) {
      setSelectedDate(date);
    }
  }

  function onTimeChange(event: DateTimePickerEvent, time?: Date) {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (event.type === "set" && time) {
      setSelectedTime(time);
    }
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

      <View style={styles.row}>
        <View style={styles.selectorWrapper}>
          <Pressable
            style={styles.selector}
            onPress={() => setDateMenuVisible((prev) => !prev)}
          >
            <Ionicons name="calendar-outline" size={16} color="#5B4CF0" />
            <Text style={styles.selectorText}>
              {formatDateLabel(selectedDate)}
            </Text>
          </Pressable>

          {dateMenuVisible && (
            <View style={styles.menu}>
              <Pressable style={styles.menuItem} onPress={selectToday}>
                <Text style={styles.menuItemText}>Today</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={selectTomorrow}>
                <Text style={styles.menuItemText}>Tomorrow</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={openDatePicker}>
                <Text style={styles.menuItemText}>Pick a date</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          style={styles.selector}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={16} color="#5B4CF0" />
          <Text style={styles.selectorText}>
            {formatTimeLabel(selectedTime)}
          </Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
          themeVariant="light"
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
          is24Hour={false}
          themeVariant="light"
        />
      )}
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

  row: {
    flexDirection: "row",
    gap: 10,
  },

  selectorWrapper: {
    position: "relative",
  },

  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#5B4CF0",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  selectorText: {
  color: "#111827",
  fontSize: 15,
  fontWeight: "700",
},

  menu: {
    position: "absolute",
    top: 46,
    left: 0,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 4,
    width: 140,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 10,
  },

  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  menuItemText: {
    color: "#1F1B4D",
    fontSize: 14,
  },
});