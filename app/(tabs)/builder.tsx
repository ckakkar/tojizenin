import React, { useState, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database/index';
import Routine from '../../database/models/Routine';
import RoutineDay from '../../database/models/RoutineDay';
import RoutineDayExercise from '../../database/models/RoutineDayExercise';
import Exercise from '../../database/models/Exercise';
import { useRouter, useFocusEffect } from 'expo-router';

interface DayDraft {
  localId: string;
  name: string;
  exercises: string[];
  exerciseInput: string;
}

export default function BuilderScreen() {
  const router = useRouter();
  const [routineName, setRoutineName] = useState('');
  const [days, setDays] = useState<DayDraft[]>([]);
  const [newDayName, setNewDayName] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRoutineName('');
      setDays([]);
      setNewDayName('');
    }, [])
  );

  const addDay = () => {
    if (!newDayName.trim()) return;
    setDays(prev => [...prev, {
      localId: Date.now().toString(),
      name: newDayName.trim(),
      exercises: [],
      exerciseInput: '',
    }]);
    setNewDayName('');
  };

  const removeDay = (localId: string) => {
    setDays(prev => prev.filter(d => d.localId !== localId));
  };

  const updateExerciseInput = (localId: string, value: string) => {
    setDays(prev => prev.map(d => d.localId === localId ? { ...d, exerciseInput: value } : d));
  };

  const addExercise = (localId: string) => {
    setDays(prev => prev.map(d => {
      if (d.localId !== localId || !d.exerciseInput.trim()) return d;
      return { ...d, exercises: [...d.exercises, d.exerciseInput.trim()], exerciseInput: '' };
    }));
  };

  const removeExercise = (localId: string, idx: number) => {
    setDays(prev => prev.map(d => {
      if (d.localId !== localId) return d;
      return { ...d, exercises: d.exercises.filter((_, i) => i !== idx) };
    }));
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Missing Name', 'Give your routine a name.');
      return;
    }
    if (days.length === 0) {
      Alert.alert('No Days', 'Add at least one training day.');
      return;
    }

    setSaving(true);
    try {
      const existingExercises = await database.collections.get<Exercise>('exercises').query().fetch();
      const exerciseMap = new Map<string, Exercise>();
      for (const ex of existingExercises) {
        exerciseMap.set(ex.name.toLowerCase(), ex);
      }

      await database.write(async () => {
        const routine = await database.collections.get<Routine>('routines').create(r => {
          r.name = routineName.trim();
          r.isPreset = false;
        });

        for (const day of days) {
          const routineDay = await database.collections.get<RoutineDay>('routine_days').create(d => {
            d.name = day.name;
            d.routine.set(routine);
          });

          for (const exName of day.exercises) {
            const key = exName.toLowerCase();
            let exercise = exerciseMap.get(key);
            if (!exercise) {
              exercise = await database.collections.get<Exercise>('exercises').create(e => {
                e.name = exName;
              });
              exerciseMap.set(key, exercise);
            }

            await database.collections.get<RoutineDayExercise>('routine_day_exercises').create(r => {
              r.routineDay.set(routineDay);
              r.exercise.set(exercise!);
            });
          }
        }
      });

      Alert.alert('Routine Created', `"${routineName.trim()}" is ready to use.`, [
        { text: 'Let\'s Go', onPress: () => router.replace('/routines') },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save routine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-10">
          <Text className="text-amber-400 font-bold uppercase tracking-wider">‹ Back</Text>
        </TouchableOpacity>

        <Text className="text-4xl font-black text-white mb-2 tracking-tighter">Forge Plan</Text>
        <Text className="text-zinc-500 font-medium text-sm mb-10 tracking-wider">
          Name your routine, add days, then load each day with exercises.
        </Text>

        {/* Routine name */}
        <View className="mb-8">
          <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">Routine Name</Text>
          <TextInput
            className="bg-zinc-900 text-white px-5 py-5 rounded-2xl text-lg font-bold border border-zinc-800"
            placeholder="e.g. The Bro Split"
            placeholderTextColor="#52525b"
            value={routineName}
            onChangeText={setRoutineName}
          />
        </View>

        {/* Days */}
        {days.length > 0 && (
          <View className="mb-6">
            <Text className="text-zinc-400 font-bold mb-3 uppercase text-xs tracking-wider">Days</Text>
            {days.map((day) => (
              <View key={day.localId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-3">
                {/* Day header */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white font-black text-lg uppercase tracking-tight">{day.name}</Text>
                  <TouchableOpacity onPress={() => removeDay(day.localId)} className="p-1">
                    <Text className="text-zinc-600 font-black text-xl">×</Text>
                  </TouchableOpacity>
                </View>

                {/* Exercises */}
                {day.exercises.map((ex, idx) => (
                  <View key={idx} className="flex-row justify-between items-center py-2 border-b border-zinc-800">
                    <Text className="text-zinc-300 font-bold text-sm flex-1">{ex}</Text>
                    <TouchableOpacity onPress={() => removeExercise(day.localId, idx)} className="ml-4 p-1">
                      <Text className="text-zinc-600 font-black">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add exercise row */}
                <View className="flex-row mt-4 gap-2">
                  <TextInput
                    className="flex-1 bg-black text-white px-4 py-3 rounded-xl text-sm font-bold border border-zinc-800"
                    placeholder="Exercise name..."
                    placeholderTextColor="#52525b"
                    value={day.exerciseInput}
                    onChangeText={v => updateExerciseInput(day.localId, v)}
                    onSubmitEditing={() => addExercise(day.localId)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={() => addExercise(day.localId)}
                    className="bg-zinc-800 px-4 rounded-xl items-center justify-center"
                  >
                    <Text className="text-amber-400 font-black text-lg">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add day row */}
        <View className="mb-2">
          <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">Add Day</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-zinc-900 text-white px-5 py-4 rounded-2xl text-base font-bold border border-zinc-800"
              placeholder="e.g. Push, Pull, Legs..."
              placeholderTextColor="#52525b"
              value={newDayName}
              onChangeText={setNewDayName}
              onSubmitEditing={addDay}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={addDay}
              className="bg-zinc-900 border border-zinc-800 px-5 rounded-2xl items-center justify-center"
            >
              <Text className="text-amber-400 font-black text-xl">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className={`w-full py-5 rounded-2xl items-center mt-10 ${saving ? 'bg-amber-400/50' : 'bg-amber-400'}`}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-black font-black text-xl uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save Routine'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
