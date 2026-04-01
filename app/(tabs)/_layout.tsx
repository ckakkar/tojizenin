import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', backgroundColor: '#18181b', borderTopWidth: 0 },
          default: { backgroundColor: '#18181b', borderTopWidth: 0 },
        }),
        tabBarActiveTintColor: '#fbbf24', // amber-400
        tabBarInactiveTintColor: '#a1a1aa' // zinc-400
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="barbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Builder',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
