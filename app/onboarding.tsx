import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { saveUserProfile, seedPresetRoutines } from '../database/seed';

export default function OnboardingScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');

  const handleComplete = async () => {
    if (!name || !height || !weight) {
      Alert.alert('Missing Info', 'Please fill out all fields to personalize your app.');
      return;
    }
    
    // Convert to strict numbers
    const h = parseFloat(height);
    const w = parseFloat(weight);
    
    // Save to DB
    await saveUserProfile(name, h, w, units);
    // Add default routines so app isn't empty
    await seedPresetRoutines();
    
    // Next
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}>
          
          <Text className="text-4xl font-black text-amber-400 mb-2 mt-10">Welcome to Tojizenin.</Text>
          <Text className="text-zinc-400 font-medium text-lg mb-10 leading-snug">
            Let's personalize your tracking experience before your first set.
          </Text>

          <View className="mb-6">
            <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">Your Name</Text>
            <TextInput 
              className="bg-zinc-900 text-white px-5 py-5 rounded-2xl text-lg font-bold border border-zinc-800 focus:border-amber-400"
              placeholder="e.g. Toji Zenin"
              placeholderTextColor="#52525b"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-6">
            <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">Unit Preference</Text>
            <View className="flex-row bg-zinc-900 p-1 rounded-2xl">
              <TouchableOpacity 
                className={`flex-1 py-4 items-center rounded-xl ${units === 'imperial' ? 'bg-amber-400' : 'bg-transparent'}`}
                onPress={() => setUnits('imperial')}
              >
                <Text className={`font-bold ${units === 'imperial' ? 'text-black' : 'text-zinc-400'}`}>Imperial (lbs/in)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-4 items-center rounded-xl ${units === 'metric' ? 'bg-amber-400' : 'bg-transparent'}`}
                onPress={() => setUnits('metric')}
              >
                <Text className={`font-bold ${units === 'metric' ? 'text-black' : 'text-zinc-400'}`}>Metric (kg/cm)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row space-x-4 mb-10 gap-4">
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">{units === 'imperial' ? 'Height (inches)' : 'Height (cm)'}</Text>
              <TextInput 
                className="bg-zinc-900 text-white px-5 py-5 rounded-2xl text-lg font-bold border border-zinc-800 focus:border-amber-400"
                keyboardType="numeric"
                placeholder={units === 'imperial' ? "70" : "178"}
                placeholderTextColor="#52525b"
                value={height}
                onChangeText={setHeight}
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs tracking-wider">{units === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}</Text>
              <TextInput 
                className="bg-zinc-900 text-white px-5 py-5 rounded-2xl text-lg font-bold border border-zinc-800 focus:border-amber-400"
                keyboardType="numeric"
                placeholder={units === 'imperial' ? "185" : "84"}
                placeholderTextColor="#52525b"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          <TouchableOpacity 
            className="w-full bg-amber-400 py-5 rounded-2xl items-center shadow-lg mt-auto mb-10"
            onPress={handleComplete}
          >
            <Text className="text-black font-black text-xl uppercase tracking-wider">Start Training</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
