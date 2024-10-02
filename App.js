import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const saveHabits = async (habitsToSave) => {
  try {
    const jsonValue = JSON.stringify(habitsToSave);
    await AsyncStorage.setItem('@habits', jsonValue);
  } catch (e) {
    console.error('Error saving habits:', e);
  }
};

const loadHabits = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@habits');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading habits:', e);
    return [];
  }
};

function App() {
  const [habits, setHabits] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      const loadedHabits = await loadHabits();
      setHabits(loadedHabits);
    };
    fetchHabits();
  }, []);

  const addHabit = async () => {
    if (habitName && selectedDays.length > 0) {
      const newHabit = {
        id: Date.now().toString(),
        name: habitName,
        days: selectedDays,
        frequency: selectedDays.length === 1 ? 'weekly' : 'daily',
        completedDays: [],
      };
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      setIsModalVisible(false);
      setHabitName('');
      setSelectedDays([]);
    }
  };

  const toggleHabit = async (habitId, day) => {
    const currentDate = new Date().toISOString().split('T')[0];

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        if (habit.frequency === 'weekly') {
          const isCompleted = habit.completedDays.some(d => d.startsWith(currentDate.slice(0, 7)));
          if (isCompleted) {
            return {
              ...habit,
              completedDays: habit.completedDays.filter(d => !d.startsWith(currentDate.slice(0, 7)))
            };
          } else {
            return {
              ...habit,
              completedDays: [...habit.completedDays, `${currentDate.slice(0, 7)}-${day}`]
            };
          }
        } else {
          return {
            ...habit,
            completedDays: habit.completedDays.includes(day)
              ? habit.completedDays.filter(d => d !== day)
              : [...habit.completedDays, day]
          };
        }
      }
      return habit;
    });

    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Helper function to get the week number of a date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Habit Tracker</Text>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.weeklyView}>
          <View style={styles.header}>
            <Text style={styles.habitName}>Habit</Text>
            {daysOfWeek.map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          {habits.map(habit => (
            <View key={habit.id} style={styles.habitRow}>
              <Text style={styles.habitName}>{habit.name}</Text>
              {daysOfWeek.map(day => {
                const isWeeklyHabit = habit.frequency === 'weekly';
                const currentDate = new Date().toISOString().split('T')[0];
                const isDayCompleted = isWeeklyHabit
                  ? habit.completedDays.some(d => d.endsWith(day) && d.startsWith(currentDate.slice(0, 7)))
                  : habit.completedDays.includes(day);
                const isScheduledDay = habit.days.includes(day);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.checkbox,
                      isDayCompleted && styles.checked,
                      !isScheduledDay && styles.disabled
                    ]}
                    onPress={() => isScheduledDay && toggleHabit(habit.id, day)}
                    disabled={!isScheduledDay}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add Habit</Text>
      </TouchableOpacity>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            <TextInput
              style={styles.input}
              placeholder="Habit Name"
              value={habitName}
              onChangeText={setHabitName}
            />
            <Text style={styles.label}>Select Days:</Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, selectedDays.includes(day) && styles.selectedDay]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={styles.dayButtonText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.addHabitButton} onPress={addHabit}>
              <Text style={styles.addButtonText}>Add Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  scrollView: {
    flexGrow: 1,
  },
  weeklyView: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  habitName: {
    width: 100,
    marginRight: 10,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    margin: 2,
  },
  checked: {
    backgroundColor: '#4CAF50',
  },
  disabled: {
    opacity: 0.3,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
  },
  dayButtonText: {
    textAlign: 'center',
  },
  addHabitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;