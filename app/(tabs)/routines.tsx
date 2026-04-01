import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { database } from '../../database/index';
import Routine from '../../database/models/Routine';
import { useRouter } from 'expo-router';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    const fetchRoutines = async () => {
      const allRoutines = await database.collections.get<Routine>('routines').query().fetch();
      setRoutines(allRoutines);
    };
    fetchRoutines();
  }, []);

  const handleStartWorkout = (routineName: string) => {
    router.push('/run_workout');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-3xl font-bold text-white mb-6 mt-10">Training Plans</Text>
        
        {routines.map((routine) => (
          <TouchableOpacity 
             key={routine.id}
             className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4 flex-row justify-between items-center"
             onPress={() => handleStartWorkout(routine.name)}
          >
            <View>
               <Text className="text-xl font-bold text-amber-400 mb-1">{routine.name}</Text>
               <Text className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                 {routine.isPreset ? 'Preset Configuration' : 'Custom Routine'}
               </Text>
            </View>
            <Text className="text-zinc-600 font-black text-2xl">›</Text>
          </TouchableOpacity>
        ))}

        {routines.length === 0 && (
          <View className="items-center justify-center p-10 bg-zinc-900 rounded-2xl mb-4 border border-zinc-800 border-dashed">
            <Text className="text-zinc-500 font-medium">No routines found.</Text>
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
