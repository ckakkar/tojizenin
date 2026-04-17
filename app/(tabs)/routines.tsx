import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { database } from '../../database/index';
import Routine from '../../database/models/Routine';
import RoutineDay from '../../database/models/RoutineDay';
import { useRouter, useFocusEffect } from 'expo-router';
import { Skeleton } from '../../components/Skeleton';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [daysByRoutine, setDaysByRoutine] = useState<Record<string, RoutineDay[]>>({});
  const [exerciseCountsByDay, setExerciseCountsByDay] = useState<Record<string, number>>({});

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    setExpandedRoutineId(null);
    setDaysByRoutine({});
    setExerciseCountsByDay({});
    setTimeout(async () => {
      const allRoutines = await database.collections.get<Routine>('routines').query().fetch();
      const counts: Record<string, number> = {};
      for (const r of allRoutines) {
        counts[r.id] = await r.routineDays.fetchCount();
      }
      setRoutines(allRoutines);
      setDayCounts(counts);
      setLoading(false);
    }, 500);
  }, []);

  // Reload every time the tab is focused (e.g. after builder creates a routine)
  useFocusEffect(useCallback(() => { loadRoutines(); }, [loadRoutines]));

  const handleToggleRoutine = async (routine: Routine) => {
    if (expandedRoutineId === routine.id) {
      setExpandedRoutineId(null);
      return;
    }
    if (!daysByRoutine[routine.id]) {
      const days = await routine.routineDays.fetch();
      const exCounts: Record<string, number> = {};
      for (const day of days) {
        exCounts[day.id] = await day.routineDayExercises.fetchCount();
      }
      setDaysByRoutine(prev => ({ ...prev, [routine.id]: days }));
      setExerciseCountsByDay(prev => ({ ...prev, ...exCounts }));
    }
    setExpandedRoutineId(routine.id);
  };

  const handleStartDay = (day: RoutineDay) => {
    router.push(`/run_workout?dayId=${day.id}&dayName=${encodeURIComponent(day.name)}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <Text className="text-3xl font-black text-white mb-6 mt-10 tracking-tighter">Training Plans</Text>
          <Skeleton className="w-full h-24 rounded-2xl mb-4" />
          <Skeleton className="w-full h-24 rounded-2xl mb-4" />
          <Skeleton className="w-full h-24 rounded-2xl mb-4" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-3xl font-black text-white mb-6 mt-10 tracking-tighter">Training Plans</Text>

        {routines.map((routine) => {
          const isExpanded = expandedRoutineId === routine.id;
          const days = daysByRoutine[routine.id] ?? [];
          const dayCount = dayCounts[routine.id] ?? 0;

          return (
            <View key={routine.id} className="mb-4">
              <TouchableOpacity
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-row justify-between items-center"
                onPress={() => handleToggleRoutine(routine)}
                activeOpacity={0.7}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-xl font-black text-amber-400 mb-1 tracking-tight">{routine.name}</Text>
                  <Text className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    {dayCount} {dayCount === 1 ? 'day' : 'days'}
                    {' • '}
                    {routine.isPreset ? 'Preset' : 'Custom'}
                  </Text>
                </View>
                <Text className="text-zinc-500 font-black text-xl">{isExpanded ? '↑' : '↓'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View className="mt-2 pl-3">
                  {days.length === 0 ? (
                    <View className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-5 items-center">
                      <Text className="text-zinc-600 font-bold text-xs uppercase tracking-widest">No days configured</Text>
                    </View>
                  ) : (
                    days.map((day) => {
                      const exCount = exerciseCountsByDay[day.id] ?? 0;
                      return (
                        <TouchableOpacity
                          key={day.id}
                          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-2 flex-row justify-between items-center"
                          onPress={() => handleStartDay(day)}
                          activeOpacity={0.7}
                        >
                          <View>
                            <Text className="text-white font-black text-base tracking-tight">{day.name}</Text>
                            <Text className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest mt-1">
                              {exCount} {exCount === 1 ? 'exercise' : 'exercises'}
                            </Text>
                          </View>
                          <View className="bg-amber-400 rounded-xl px-5 py-3">
                            <Text className="text-black font-black text-xs uppercase tracking-wider">Start</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}

        {routines.length === 0 && (
          <View className="items-center justify-center p-10 bg-zinc-900 rounded-2xl mb-4 border border-zinc-800 border-dashed">
            <Text className="text-zinc-500 font-bold tracking-wider text-center">No routines yet.</Text>
            <Text className="text-zinc-700 font-bold text-xs tracking-wider text-center mt-2">
              Tap the button below to build your first one.
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="w-full bg-amber-400 py-5 rounded-2xl items-center mt-4"
          onPress={() => router.push('/builder')}
          activeOpacity={0.8}
        >
          <Text className="text-black font-black text-lg uppercase tracking-wider">+ New Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
