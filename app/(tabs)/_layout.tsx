import React from 'react';
import { Tabs } from 'expo-router';
import { StickyNote, Clock } from 'lucide-react-native';
import { useCustomTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { colorScheme, primaryColor, reminderCount } = useCustomTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#71717a',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#09090b' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#27272a' : '#e4e4e7',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          elevation: 0,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <StickyNote size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Clock size={24} color={color} strokeWidth={2.5} />,
          tabBarBadge: reminderCount > 0 ? reminderCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: primaryColor,
            color: 'white',
            fontSize: 10,
          }
        }}
      />
    </Tabs>
  );
}
