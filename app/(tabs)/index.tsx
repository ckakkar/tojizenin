import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { SpreadGraph } from '../../components/SpreadGraph';
import { getUserProfile } from '../../database/seed';
import { database } from '../../database/index';
import UserProfile from '../../database/models/UserProfile';
import Exercise from '../../database/models/Exercise';
import SetLog from '../../database/models/SetLog';
import WorkoutSession from '../../database/models/WorkoutSession';
import { Skeleton } from '../../components/Skeleton';

export default function DashboardScreen() {
  const [viewMode, setViewMode] = useState<'1RM' | 'Volume'>('1RM');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseTag, setExerciseTag] = useState('');
  const [oneRmData, setOneRmData] = useState<{ x: number; y: number }[]>([]);
  const [volumeData, setVolumeData] = useState<{ x: number; y: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prof = await getUserProfile();
        setProfile(prof);

        const exercises = await database.collections.get<Exercise>('exercises').query().fetch();
        if (exercises.length === 0) { setLoading(false); return; }

        const targetExercise = exercises[0];
        setExerciseName(targetExercise.name);

        const tags = await targetExercise.tags.fetch();
        const primaryTag = tags.find((t: any) => t.category === 'Primary') ?? tags[0];
        if (primaryTag) setExerciseTag(primaryTag.name);

        const logs = await database.collections
          .get<SetLog>('set_logs')
          .query(Q.where('exercise_id', targetExercise.id))
          .fetch();

        if (logs.length === 0) { setLoading(false); return; }

        const sessionIds = [...new Set(logs.map(l => l.workoutSessionId))];
        const sessions = await database.collections
          .get<WorkoutSession>('workout_sessions')
          .query(Q.where('id', Q.oneOf(sessionIds)))
          .fetch();
        const sessionMap = new Map(sessions.map(s => [s.id, s]));

        const oneRmByDate = new Map<number, number>();
        const volumeByDate = new Map<number, number>();

        for (const log of logs) {
          const session = sessionMap.get(log.workoutSessionId);
          if (!session) continue;
          const d = new Date(session.createdAt);
          d.setHours(0, 0, 0, 0);
          const dateKey = d.getTime();

          const e1rm = log.weight * (1 + log.reps / 30);
          if (!oneRmByDate.has(dateKey) || oneRmByDate.get(dateKey)! < e1rm) {
            oneRmByDate.set(dateKey, e1rm);
          }
          volumeByDate.set(dateKey, (volumeByDate.get(dateKey) ?? 0) + log.weight * log.reps);
        }

        const toSorted = (map: Map<number, number>) =>
          Array.from(map.entries()).sort(([a], [b]) => a - b).map(([x, y]) => ({ x, y }));

        setOneRmData(toSorted(oneRmByDate));
        setVolumeData(toSorted(volumeByDate));
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const unit = profile?.unitPreference === 'metric' ? 'kg' : 'lbs';

  const convert = (y: number) => unit === 'kg' ? Math.round(y * 0.453592) : Math.round(y);
  const rawData = viewMode === '1RM' ? oneRmData : volumeData;
  const displayData = rawData.map(d => ({ x: d.x, y: convert(d.y) }));

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="px-6 pt-10 pb-6">
            <Skeleton className="h-10 w-64 rounded-xl mb-3" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </View>
          <View className="mx-6 mb-4 pb-2">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </View>
          <View className="mb-6">
            <View className="mx-6 flex-row justify-between items-end mb-2 mt-4">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </View>
            <View className="p-4 mx-4 my-2 h-[280px]">
              <Skeleton className="w-full h-full rounded-2xl" />
            </View>
          </View>
          <View className="px-6 mt-4">
            <Skeleton className="h-3 w-32 rounded-md mb-5" />
            <Skeleton className="w-full h-16 rounded-2xl mb-2" />
            <Skeleton className="w-full h-16 rounded-2xl mb-2" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-10 pb-6">
          <Text className="text-5xl font-black text-amber-400 uppercase tracking-tighter">
            Tojizenin
          </Text>
          <Text className="text-zinc-500 font-bold text-sm tracking-widest uppercase mt-2">
            Welcome back, {profile?.name || 'Athlete'}
          </Text>
        </View>

        <View className="flex-row mx-6 mb-4 bg-zinc-900 rounded-2xl p-1 border border-zinc-800">
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-xl ${viewMode === '1RM' ? 'bg-amber-400' : 'bg-transparent'}`}
            onPress={() => setViewMode('1RM')}
          >
            <Text className={`font-bold ${viewMode === '1RM' ? 'text-black' : 'text-zinc-400'}`}>Est. 1RM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-xl ${viewMode === 'Volume' ? 'bg-amber-400' : 'bg-transparent'}`}
            onPress={() => setViewMode('Volume')}
          >
            <Text className={`font-bold ${viewMode === 'Volume' ? 'text-black' : 'text-zinc-400'}`}>Total Volume</Text>
          </TouchableOpacity>
        </View>

        {exerciseName ? (
          <View className="mb-6">
            <View className="mx-6 flex-row justify-between items-end mb-2">
              <Text className="text-2xl font-black text-white px-2 tracking-tight">{exerciseName}</Text>
              {exerciseTag ? (
                <Text className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase overflow-hidden">{exerciseTag}</Text>
              ) : null}
            </View>
            <SpreadGraph data={displayData} type={viewMode} unit={unit} />
          </View>
        ) : (
          <View className="mx-6 mb-6 p-10 bg-zinc-900 rounded-2xl border border-zinc-800 border-dashed items-center">
            <Text className="text-zinc-500 font-bold text-center">No workout data yet.</Text>
            <Text className="text-zinc-600 text-xs text-center mt-2">Complete a session to see your progress here.</Text>
          </View>
        )}

        {displayData.length > 0 && (
          <View className="px-6 mt-4">
            <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4">Recent Sessions</Text>
            {displayData.slice().reverse().map((data, idx) => (
              <View key={idx} className="flex-row justify-between items-center bg-zinc-900 mb-2 p-5 rounded-2xl border border-zinc-800">
                <Text className="text-zinc-300 font-black">{new Date(data.x).toLocaleDateString()}</Text>
                <Text className="text-amber-400 font-black text-lg">{data.y} {unit}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
