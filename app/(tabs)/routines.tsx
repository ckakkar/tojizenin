import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { database } from '../../database/index';
import Routine from '../../database/models/Routine';
import RoutineDay from '../../database/models/RoutineDay';
import { useRouter } from 'expo-router';
import { Skeleton } from '../../components/Skeleton';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [daysByRoutine, setDaysByRoutine] = useState<Record<string, RoutineDay[]>>({});

  useEffect(() => {
    const fetchRoutines = async () => {
      setTimeout(async () => {
        const allRoutines = await database.collections.get<Routine>('routines').query().fetch();
        setRoutines(allRoutines);
        setLoading(false);
      }, 700);
    };
    fetchRoutines();
  }, []);

  const handleToggleRoutine = async (routine: Routine) => {
    if (expandedRoutineId === routine.id) {
      setExpandedRoutineId(null);
      return;
    }
    if (!daysByRoutine[routine.id]) {
      const days = await routine.routineDays.fetch();
      setDaysByRoutine(prev => ({ ...prev, [routine.id]: days }));
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
          <Text className="text-3xl font-bold text-white mb-6 mt-10">Training Plans</Text>
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
        <Text className="text-3xl font-bold text-white mb-6 mt-10">Training Plans</Text>

        {routines.map((routine) => {
          const isExpanded = expandedRoutineId === routine.id;
          const days = daysByRoutine[routine.id] ?? [];

          return (
            <View key={routine.id} className="mb-4">
              <TouchableOpacity
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-row justify-between items-center"
                onPress={() => handleToggleRoutine(routine)}
              >
                <View>
                  <Text className="text-xl font-bold text-amber-400 mb-1">{routine.name}</Text>
                  <Text className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    {routine.isPreset ? 'Preset Configuration' : 'Custom Routine'}
                  </Text>
                </View>
                <Text className="text-zinc-600 font-black text-2xl">{isExpanded ? '∨' : '›'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View className="mt-2 ml-4">
                  {days.length === 0 ? (
                    <View className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-4 items-center">
                      <Text className="text-zinc-600 font-bold text-xs uppercase tracking-widest">No days configured</Text>
                    </View>
                  ) : (
                    days.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-2 flex-row justify-between items-center"
                        onPress={() => handleStartDay(day)}
                      >
                        <View>
                          <Text className="text-white font-black text-lg">{day.name}</Text>
                          <Text className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">Tap to start</Text>
                        </View>
                        <View className="bg-amber-400 rounded-xl px-4 py-2">
                          <Text className="text-black font-black text-xs uppercase tracking-wider">Start</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}

        {routines.length === 0 && (
          <View className="items-center justify-center p-10 bg-zinc-900 rounded-2xl mb-4 border border-zinc-800 border-dashed">
            <Text className="text-zinc-500 font-medium tracking-wider">No routines found.</Text>
          </View>
        )}

        <TouchableOpacity
          className="w-full bg-amber-400 py-5 rounded-2xl items-center shadow-lg mt-6"
          onPress={() => router.push('/builder')}
        >
          <Text className="text-black font-black text-xl uppercase tracking-wider">+ Create Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
