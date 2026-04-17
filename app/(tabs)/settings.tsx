import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { getUserProfile, resetDatabase } from '../../database/seed';
import { database } from '../../database/index';
import UserProfile from '../../database/models/UserProfile';
import { useRouter, useFocusEffect } from 'expo-router';
import { Skeleton } from '../../components/Skeleton';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const prof = await getUserProfile();
    setProfile(prof);
    setApiKeyInput(prof?.deepseekApiKey ?? '');
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSaveApiKey = async () => {
    if (!profile) return;
    setSavingKey(true);
    try {
      await database.write(async () => {
        await profile.update(p => {
          p.deepseekApiKey = apiKeyInput.trim() || undefined;
        });
      });
      setProfile(await getUserProfile());
      Alert.alert('Saved', 'DeepSeek API key updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save API key.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Danger Zone',
      'This will wipe ALL routines, logs, and your profile. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything', style: 'destructive', onPress: async () => {
            await resetDatabase();
            router.replace('/onboarding');
          }
        },
      ]
    );
  };

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <Text className="text-3xl font-black text-white mb-6 mt-10 tracking-tighter">Profile</Text>
          <Skeleton className="w-full h-48 rounded-3xl mb-8" />
          <Skeleton className="w-full h-36 rounded-3xl mb-8" />
          <Skeleton className="w-full h-16 rounded-2xl" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const keyIsSaved = !!profile.deepseekApiKey?.trim();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-3xl font-black text-white mb-6 mt-10 tracking-tighter">Profile</Text>

        {/* Profile card */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-6 border border-zinc-800">
          <Text className="text-3xl font-black text-amber-400 mb-6 uppercase tracking-wider">{profile.name}</Text>

          <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
            <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Weight</Text>
            <Text className="text-white font-bold">
              {profile.weight} {profile.unitPreference === 'imperial' ? 'lbs' : 'kg'}
            </Text>
          </View>

          <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
            <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Height</Text>
            <Text className="text-white font-bold">
              {profile.height} {profile.unitPreference === 'imperial' ? 'in' : 'cm'}
            </Text>
          </View>

          <View className="flex-row justify-between pt-2">
            <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Unit System</Text>
            <Text className="text-emerald-400 font-black uppercase tracking-widest">{profile.unitPreference}</Text>
          </View>
        </View>

        {/* DeepSeek AI section */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-6 border border-zinc-800">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white font-black text-base uppercase tracking-wide">DeepSeek AI</Text>
            {keyIsSaved && (
              <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
                <Text className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Connected</Text>
              </View>
            )}
          </View>
          <Text className="text-zinc-500 text-xs mb-5 leading-relaxed">
            Your API key is stored locally on-device and never sent anywhere except DeepSeek's servers.
            Get one free at platform.deepseek.com.
          </Text>

          <Text className="text-zinc-400 font-bold mb-2 uppercase text-[10px] tracking-wider">API Key</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 bg-black text-white px-4 py-4 rounded-2xl text-sm font-bold border border-zinc-800"
              placeholder="sk-..."
              placeholderTextColor="#3f3f46"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowKey(v => !v)}
              className="bg-zinc-800 px-4 rounded-2xl items-center justify-center"
            >
              <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                {showKey ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-2xl items-center ${savingKey ? 'bg-zinc-700' : 'bg-zinc-800'}`}
            onPress={handleSaveApiKey}
            disabled={savingKey}
          >
            <Text className="text-amber-400 font-black uppercase tracking-wider text-sm">
              {savingKey ? 'Saving...' : keyIsSaved ? 'Update Key' : 'Save Key'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <Text className="text-red-500 font-bold mb-3 uppercase tracking-widest text-xs">Danger Zone</Text>
        <TouchableOpacity
          className="w-full bg-red-500/10 border border-red-500/30 py-5 rounded-2xl items-center"
          onPress={handleReset}
        >
          <Text className="text-red-500 font-bold text-base uppercase tracking-wider">Reset Database</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
