import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { hasUserProfile } from '../database/seed';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSetup() {
      try {
        const hasProfile = await hasUserProfile();
        if (!hasProfile) {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error("DB checking error", e);
      } finally {
        setIsReady(true);
      }
    }
    checkSetup();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fbbf24" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="run_workout" />
        <Stack.Screen name="modal" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
