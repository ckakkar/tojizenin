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

export default function RunWorkoutScreen() {
  const router = useRouter();
  const { dayId, dayName } = useLocalSearchParams<{ dayId: string; dayName: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseTags, setExerciseTags] = useState<Map<string, string>>(new Map());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, { weight: number; reps: number }[]>>({});
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
      const exs = exerciseIds.length > 0
        ? await database.collections
            .get<Exercise>('exercises')
            .query(Q.where('id', Q.oneOf(exerciseIds)))
            .fetch()
        : [];

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

  const handleLogSet = async () => {
    if (!weight || !reps || !currentExercise) return;

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r)) return;

    const e1rm = w * (1 + r / 30);
    const tv = w * r;

    await database.write(async () => {
      let session: WorkoutSession;
      if (!sessionIdRef.current) {
        const day = await database.collections.get<RoutineDay>('routine_days').find(dayId);
        session = await database.collections.get<WorkoutSession>('workout_sessions').create(s => {
          s.createdAt = new Date();
          s.routineDay.set(day);
        });
        sessionIdRef.current = session.id;
      } else {
        session = await database.collections.get<WorkoutSession>('workout_sessions').find(sessionIdRef.current);
      }

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
    Alert.alert('Set Locked In', `Est. 1RM: ${e1rm.toFixed(1)} ${unit}   |   Volume: ${tv} ${unit}`);
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
          <Text className="text-amber-400 font-black text-2xl uppercase mb-4">No Exercises</Text>
          <Text className="text-zinc-500 text-center mb-8">This day has no exercises configured yet.</Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-zinc-900 border border-zinc-800 py-4 px-8 rounded-2xl">
            <Text className="text-amber-400 font-bold uppercase tracking-wider">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentSets = loggedSets[currentExercise?.id] ?? [];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-10">
          <Text className="text-amber-400 font-bold uppercase tracking-wider">‹ Cancel Workout</Text>
        </TouchableOpacity>

        <Text className="text-4xl font-black text-white mb-1 uppercase tracking-tight">Active Session</Text>
        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">{dayName ?? 'Workout'}</Text>

        {/* Exercise navigator */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => { setCurrentIdx(i => Math.max(0, i - 1)); setWeight(''); setReps(''); }}
            disabled={currentIdx === 0}
            className={`py-2 px-4 rounded-xl ${currentIdx === 0 ? 'opacity-20' : ''}`}
          >
            <Text className="text-amber-400 font-black text-lg">‹</Text>
          </TouchableOpacity>
          <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
            {currentIdx + 1} / {exercises.length}
          </Text>
          <TouchableOpacity
            onPress={() => { setCurrentIdx(i => Math.min(exercises.length - 1, i + 1)); setWeight(''); setReps(''); }}
            disabled={currentIdx === exercises.length - 1}
            className={`py-2 px-4 rounded-xl ${currentIdx === exercises.length - 1 ? 'opacity-20' : ''}`}
          >
            <Text className="text-amber-400 font-black text-lg">›</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-zinc-900 rounded-3xl p-6 mb-4 border border-zinc-800 shadow-2xl">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black text-amber-400 uppercase flex-1 mr-2" numberOfLines={1}>
              {currentExercise?.name}
            </Text>
            <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              {exerciseTags.get(currentExercise?.id ?? '') ?? ''}
            </Text>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Weight ({unit})</Text>
              <TextInput
                className="bg-black text-white px-5 py-5 rounded-2xl text-2xl font-black border border-zinc-800 text-center"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                placeholder="225"
                placeholderTextColor="#27272a"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Reps</Text>
              <TextInput
                className="bg-black text-white px-5 py-5 rounded-2xl text-2xl font-black border border-zinc-800 text-center"
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
                placeholder="5"
                placeholderTextColor="#27272a"
              />
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-amber-400 py-5 rounded-2xl items-center shadow-lg"
            onPress={handleLogSet}
          >
            <Text className="text-black font-black text-lg uppercase tracking-widest">Lock In Set</Text>
          </TouchableOpacity>
        </View>

        {/* Logged sets for current exercise */}
        {currentSets.length > 0 && (
          <View className="mt-2">
            <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-3">Logged Sets</Text>
            {currentSets.map((s, i) => (
              <View key={i} className="flex-row justify-between items-center bg-zinc-900 mb-2 px-5 py-4 rounded-2xl border border-zinc-800">
                <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Set {i + 1}</Text>
                <Text className="text-white font-black">{s.weight} {unit} × {s.reps}</Text>
                <Text className="text-amber-400 font-bold text-xs">
                  {(s.weight * (1 + s.reps / 30)).toFixed(1)} {unit} 1RM
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          className="w-full bg-zinc-900 border border-zinc-800 py-5 rounded-2xl items-center mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-black text-lg uppercase tracking-widest">Finish Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
