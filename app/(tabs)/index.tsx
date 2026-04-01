import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { SpreadGraph } from '../../components/SpreadGraph';
import { getUserProfile } from '../../database/seed';
import UserProfile from '../../database/models/UserProfile';
import { Skeleton } from '../../components/Skeleton';

// Mock data (Assuming DB stores raw lb data natively to normalize!)
const MOCK_DATA = [
  { x: new Date('2023-01-01').getTime(), y: 225 },
  { x: new Date('2023-01-08').getTime(), y: 228 },
  { x: new Date('2023-01-15').getTime(), y: 231 },
  { x: new Date('2023-01-22').getTime(), y: 235 },
  { x: new Date('2023-01-29').getTime(), y: 242 },
];

export default function DashboardScreen() {
  const [viewMode, setViewMode] = useState<'1RM' | 'Volume'>('1RM');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artificial 800ms lag to demonstrate pure loading aesthetic internally
    setTimeout(() => {
      getUserProfile().then((res) => {
        setProfile(res);
        setLoading(false);
      });
    }, 800);
  }, []);

  const unit = profile?.unitPreference === 'metric' ? 'kg' : 'lbs';
  const displayData = MOCK_DATA.map(d => ({
    x: d.x,
    y: unit === 'kg' ? Math.round(d.y * 0.453592) : d.y
  }));

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

        <View className="mb-6">
          <View className="mx-6 flex-row justify-between items-end mb-2">
            <Text className="text-2xl font-black text-white px-2 tracking-tight">Bench Press</Text>
            <Text className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase overflow-hidden">Chest</Text>
          </View>
          <SpreadGraph data={displayData} type={viewMode} unit={unit} />
        </View>

        <View className="px-6 mt-4">
          <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4">Recent Sessions</Text>
          {displayData.slice().reverse().map((data: any, idx: number) => (
             <View key={idx} className="flex-row justify-between items-center bg-zinc-900 mb-2 p-5 rounded-2xl border border-zinc-800">
               <Text className="text-zinc-300 font-black">{new Date(data.x).toLocaleDateString()}</Text>
               <Text className="text-amber-400 font-black text-lg">{data.y} {unit}</Text>
             </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
