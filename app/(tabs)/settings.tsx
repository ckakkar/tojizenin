import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getUserProfile, resetDatabase } from '../../database/seed';
import UserProfile from '../../database/models/UserProfile';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  const handleReset = () => {
    Alert.alert(
      "Danger Zone", 
      "Are you absolutely sure? This will wipe ALL of your custom routines, logs, and profile settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Wipe Everything", style: "destructive", onPress: async () => {
             await resetDatabase();
             router.replace('/onboarding');
        }}
      ]
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-3xl font-bold text-white mb-6 mt-10">Profile</Text>

        <View className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800">
           <Text className="text-3xl font-black text-amber-400 mb-6 uppercase tracking-wider">{profile.name}</Text>
           
           <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
             <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Weight</Text>
             <Text className="text-white font-bold">{profile.weight} {profile.unitPreference === 'imperial' ? 'lbs' : 'kg'}</Text>
           </View>
           
           <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
             <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Height</Text>
             <Text className="text-white font-bold">{profile.height} {profile.unitPreference === 'imperial' ? 'in' : 'cm'}</Text>
           </View>

           <View className="flex-row justify-between pt-2">
             <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Unit System</Text>
             <Text className="text-emerald-400 font-black uppercase tracking-widest">{profile.unitPreference}</Text>
           </View>
        </View>

        <Text className="text-red-500 font-bold mb-4 uppercase tracking-widest text-xs mt-10">Danger Zone</Text>
        <TouchableOpacity 
          className="w-full bg-red-500/10 border border-red-500/30 py-5 rounded-2xl items-center"
          onPress={handleReset}
        >
          <Text className="text-red-500 font-bold text-lg uppercase tracking-wider">Reset Database</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
