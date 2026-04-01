import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfile } from '../database/seed';
import UserProfile from '../database/models/UserProfile';

export default function RunWorkoutScreen() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);
  
  const unit = profile?.unitPreference === 'metric' ? 'kg' : 'lbs';

  const handleLogSet = () => {
    if (!weight || !reps) return;
    const tv = parseInt(weight) * parseInt(reps);
    const e1rm = parseInt(weight) * (1 + parseInt(reps)/30);
    Alert.alert("Set Logged!", `Volume: ${tv} ${unit}\nEst. 1RM: ${e1rm.toFixed(1)} ${unit}`);
    setWeight('');
    setReps('');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-10">
           <Text className="text-amber-400 font-bold uppercase tracking-wider">‹ Cancel Workout</Text>
        </TouchableOpacity>
        
        <Text className="text-4xl font-black text-white mb-6 uppercase tracking-tight">Active Session</Text>
        
        <View className="bg-zinc-900 rounded-3xl p-6 mb-4 border border-zinc-800">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black text-amber-400 uppercase">Bench Press</Text>
            <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Chest</Text>
          </View>
          
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Weight ({unit})</Text>
              <TextInput 
                className="bg-black text-white px-5 py-5 rounded-2xl text-2xl font-black border border-zinc-800 focus:border-amber-400 transition-colors text-center"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="225"
                placeholderTextColor="#27272a"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Reps</Text>
              <TextInput 
                className="bg-black text-white px-5 py-5 rounded-2xl text-2xl font-black border border-zinc-800 focus:border-amber-400 transition-colors text-center"
                keyboardType="numeric"
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

      </ScrollView>
    </SafeAreaView>
  );
}
