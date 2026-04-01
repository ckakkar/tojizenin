import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { database } from '../../database/index';
import Routine from '../../database/models/Routine';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function BuilderScreen() {
  const router = useRouter();
  const [routineName, setRoutineName] = useState('');

  // Clear form when focused
  useFocusEffect(
    useCallback(() => {
      setRoutineName('');
    }, [])
  );

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Missing Info', 'Please name your routine.');
      return;
    }
    
    await database.write(async () => {
      await database.collections.get<Routine>('routines').create(routine => {
        routine.name = routineName;
        routine.isPreset = false;
      });
    });

    Alert.alert('Success', 'Your custom routine has been constructed!');
    router.replace('/routines');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-10">
           <Text className="text-amber-400 font-bold uppercase tracking-wider">‹ Back</Text>
        </TouchableOpacity>
        
        <Text className="text-4xl font-black text-white mb-2 tracking-tighter">Forge Plan</Text>
        <Text className="text-zinc-400 font-medium text-sm mb-10 leading-snug tracking-wider">
          Design your own training architecture.
        </Text>
        
        <View className="mb-6">
          <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">Routine Name</Text>
          <TextInput 
            className="bg-zinc-900 text-white px-5 py-5 rounded-2xl text-lg font-bold border border-zinc-800 focus:border-amber-400"
            placeholder="e.g. The Bro Split"
            placeholderTextColor="#52525b"
            value={routineName}
            onChangeText={setRoutineName}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-amber-400 py-5 rounded-2xl items-center shadow-lg mt-6"
          onPress={handleSave}
        >
          <Text className="text-black font-black text-xl uppercase tracking-wider">Save Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
