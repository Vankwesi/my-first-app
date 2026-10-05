import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDateLabel, formatTimeLabel } from "../utils/dateTime";

type DateTimeFieldProps = {
  date: Date;
  time: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  minimumDate?: Date;
};

export default function DateTimeField({
  date,
  time,
  onDateChange,
  onTimeChange,
  minimumDate,
}: DateTimeFieldProps) {
  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function selectToday() {
    onDateChange(new Date());
    setDateMenuVisible(false);
  }

  function selectTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onDateChange(tomorrow);
    setDateMenuVisible(false);
  }

  function openDatePicker() {
    setDateMenuVisible(false);
    setShowDatePicker(true);
  }

  function onDateValueChange(event: DateTimePickerChangeEvent, picked: Date) {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    onDateChange(picked);
  }

  function onTimeValueChange(event: DateTimePickerChangeEvent, picked: Date) {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    onTimeChange(picked);
  }

  return (
    <View style={styles.row}>
      <View style={styles.selectorWrapper}>
        <Pressable
          style={styles.selector}
          onPress={() => setDateMenuVisible((prev) => !prev)}
        >
          <Ionicons name="calendar-outline" size={16} color="#5B4CF0" />
          <Text style={styles.selectorText}>{formatDateLabel(date)}</Text>
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
        <Text style={styles.selectorText}>{formatTimeLabel(time)}</Text>
      </Pressable>

      {showDatePicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onValueChange={onDateValueChange}
            onDismiss={() => setShowDatePicker(false)}
            minimumDate={minimumDate}
            themeVariant="light"
            accentColor="#5B4CF0"
          />
          {Platform.OS === "ios" && (
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}

      {showTimePicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onValueChange={onTimeValueChange}
            onDismiss={() => setShowTimePicker(false)}
            is24Hour={false}
            themeVariant="light"
            accentColor="#5B4CF0"
          />
          {Platform.OS === "ios" && (
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    color: "#1F1B4D",
    fontSize: 14,
    fontWeight: "600",
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
  pickerWrapper: {
    width: "100%",
  },
  doneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  doneText: {
    color: "#5B4CF0",
    fontWeight: "700",
  },
});