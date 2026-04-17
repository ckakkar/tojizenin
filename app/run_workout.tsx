import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database/index';
import { getUserProfile } from '../database/seed';
import UserProfile from '../database/models/UserProfile';
import Exercise from '../database/models/Exercise';
import RoutineDayExercise from '../database/models/RoutineDayExercise';
import RoutineDay from '../database/models/RoutineDay';
import WorkoutSession from '../database/models/WorkoutSession';
import SetLog from '../database/models/SetLog';
import { Skeleton } from '../components/Skeleton';

interface LoggedSet {
  weight: number;
  reps: number;
}

export default function RunWorkoutScreen() {
  const router = useRouter();
  const { dayId, dayName } = useLocalSearchParams<{ dayId: string; dayName: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseTags, setExerciseTags] = useState<Map<string, string>>(new Map());
  const [currentIdx, setCurrentIdx] = useState(0);
  // keyed by exercise id
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [loading, setLoading] = useState(true);

  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dayId) return;
    const init = async () => {
      const prof = await getUserProfile();

      const junctionRecords = await database.collections
        .get<RoutineDayExercise>('routine_day_exercises')
        .query(Q.where('routine_day_id', dayId))
        .fetch();

      const exerciseIds = junctionRecords.map(r => r.exerciseId);

      let exs: Exercise[] = [];
      if (exerciseIds.length > 0) {
        const unsorted = await database.collections
          .get<Exercise>('exercises')
          .query(Q.where('id', Q.oneOf(exerciseIds)))
          .fetch();
        // preserve junction record order
        exs = exerciseIds
          .map(id => unsorted.find(e => e.id === id))
          .filter((e): e is Exercise => e !== undefined);
      }

      const tagMap = new Map<string, string>();
      for (const ex of exs) {
        const tags = await ex.tags.fetch();
        const primary = tags.find((t: any) => t.category === 'Primary') ?? tags[0];
        if (primary) tagMap.set(ex.id, primary.name);
      }

      setProfile(prof);
      setExercises(exs);
      setExerciseTags(tagMap);
      setLoading(false);
    };
    init();
  }, [dayId]);

  const unit = profile?.unitPreference === 'metric' ? 'kg' : 'lbs';
  const currentExercise = exercises[currentIdx];
  const currentSets = loggedSets[currentExercise?.id ?? ''] ?? [];

  const getOrCreateSession = async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;

    let sessionId = '';
    await database.write(async () => {
      const day = await database.collections.get<RoutineDay>('routine_days').find(dayId);
      const session = await database.collections.get<WorkoutSession>('workout_sessions').create(s => {
        s.createdAt = new Date();
        s.routineDay.set(day);
      });
      sessionId = session.id;
    });
    sessionIdRef.current = sessionId;
    return sessionId;
  };

  const handleLogSet = async () => {
    if (!weight || !reps || !currentExercise) return;

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;

    const e1rm = w * (1 + r / 30);

    try {
      const sessionId = await getOrCreateSession();

      await database.write(async () => {
        const session = await database.collections
          .get<WorkoutSession>('workout_sessions')
          .find(sessionId);

        await database.collections.get<SetLog>('set_logs').create(log => {
          log.weight = w;
          log.reps = r;
          log.isPr = false;
          log.workoutSession.set(session);
          log.exercise.set(currentExercise);
        });
      });

      setLoggedSets(prev => ({
        ...prev,
        [currentExercise.id]: [...(prev[currentExercise.id] ?? []), { weight: w, reps: r }],
      }));
      setWeight('');
      setReps('');

      Alert.alert(
        'Set Locked In',
        `Est. 1RM: ${e1rm.toFixed(1)} ${unit}`,
        [{ text: 'Next Set', style: 'default' }],
        { cancelable: true }
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save set. Try again.');
    }
  };

  const handleFinish = () => {
    const allSets = Object.values(loggedSets).flat();
    if (allSets.length === 0) {
      router.back();
      return;
    }

    const totalSets = allSets.length;
    const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const peakE1rm = Math.max(
      ...Object.values(loggedSets).flat().map(s => s.weight * (1 + s.reps / 30))
    );

    Alert.alert(
      'Workout Complete',
      `Sets: ${totalSets}\nTotal Volume: ${totalVolume.toFixed(0)} ${unit}\nPeak Est. 1RM: ${peakE1rm.toFixed(1)} ${unit}`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  const goToExercise = (idx: number) => {
    setCurrentIdx(idx);
    setWeight('');
    setReps('');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <View className="mb-6 mt-10"><Skeleton className="h-4 w-24 rounded-lg" /></View>
          <Skeleton className="h-10 w-48 rounded-xl mb-2" />
          <Skeleton className="h-4 w-32 rounded-md mb-8" />
          <Skeleton className="w-full h-72 rounded-3xl" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-amber-400 font-black text-2xl uppercase mb-4 tracking-tight">No Exercises</Text>
          <Text className="text-zinc-500 text-center mb-8 leading-relaxed">
            This day has no exercises. Add some in the routine builder.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-zinc-900 border border-zinc-800 py-4 px-8 rounded-2xl"
          >
            <Text className="text-amber-400 font-bold uppercase tracking-wider">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-10">
          <Text className="text-amber-400 font-bold uppercase tracking-wider">‹ Cancel</Text>
        </TouchableOpacity>

        <Text className="text-4xl font-black text-white mb-1 uppercase tracking-tight">Active Session</Text>
        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">{dayName ?? 'Workout'}</Text>

        {/* Exercise dots nav */}
        <View className="flex-row items-center justify-center gap-2 mb-6">
          {exercises.map((ex, i) => {
            const hasLogs = (loggedSets[ex.id]?.length ?? 0) > 0;
            return (
              <TouchableOpacity key={ex.id} onPress={() => goToExercise(i)}>
                <View
                  className={`rounded-full ${i === currentIdx ? 'w-8 h-3 bg-amber-400' : hasLogs ? 'w-3 h-3 bg-amber-400/40' : 'w-3 h-3 bg-zinc-700'}`}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exercise card */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-4 border border-zinc-800">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-2xl font-black text-amber-400 uppercase tracking-tight" numberOfLines={2}>
                {currentExercise?.name}
              </Text>
            </View>
            <View className="bg-zinc-800 px-3 py-1 rounded-full">
              <Text className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                {exerciseTags.get(currentExercise?.id ?? '') ?? ''}
              </Text>
            </View>
          </View>

          <Text className="text-zinc-600 font-bold text-xs uppercase tracking-widest mb-6">
            Exercise {currentIdx + 1} of {exercises.length}
          </Text>

          {/* Inputs */}
          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-zinc-500 font-bold mb-2 uppercase text-[10px] tracking-widest">Weight ({unit})</Text>
              <TextInput
                className="bg-black text-white px-4 py-5 rounded-2xl text-2xl font-black border border-zinc-800 text-center"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                placeholder="135"
                placeholderTextColor="#27272a"
                returnKeyType="next"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-500 font-bold mb-2 uppercase text-[10px] tracking-widest">Reps</Text>
              <TextInput
                className="bg-black text-white px-4 py-5 rounded-2xl text-2xl font-black border border-zinc-800 text-center"
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
                placeholder="8"
                placeholderTextColor="#27272a"
                returnKeyType="done"
                onSubmitEditing={handleLogSet}
              />
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-amber-400 py-5 rounded-2xl items-center"
            onPress={handleLogSet}
          >
            <Text className="text-black font-black text-lg uppercase tracking-widest">Lock In Set</Text>
          </TouchableOpacity>
        </View>

        {/* Logged sets for this exercise */}
        {currentSets.length > 0 && (
          <View className="mb-4">
            <Text className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest mb-3">
              {currentSets.length} {currentSets.length === 1 ? 'set' : 'sets'} logged
            </Text>
            {currentSets.map((s, i) => {
              const e1rm = s.weight * (1 + s.reps / 30);
              return (
                <View
                  key={i}
                  className="flex-row justify-between items-center bg-zinc-900 mb-2 px-5 py-4 rounded-2xl border border-zinc-800"
                >
                  <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Set {i + 1}</Text>
                  <Text className="text-white font-black">{s.weight} × {s.reps}</Text>
                  <Text className="text-amber-400 font-bold text-xs">{e1rm.toFixed(1)} {unit}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Exercise prev/next + finish */}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={() => goToExercise(currentIdx - 1)}
            disabled={currentIdx === 0}
            className={`flex-1 bg-zinc-900 border border-zinc-800 py-4 rounded-2xl items-center ${currentIdx === 0 ? 'opacity-30' : ''}`}
          >
            <Text className="text-white font-black uppercase tracking-wider text-sm">‹ Prev</Text>
          </TouchableOpacity>

          {currentIdx < exercises.length - 1 ? (
            <TouchableOpacity
              onPress={() => goToExercise(currentIdx + 1)}
              className="flex-1 bg-zinc-900 border border-zinc-800 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase tracking-wider text-sm">Next ›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              className="flex-1 bg-white py-4 rounded-2xl items-center"
            >
              <Text className="text-black font-black uppercase tracking-wider text-sm">Finish</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
