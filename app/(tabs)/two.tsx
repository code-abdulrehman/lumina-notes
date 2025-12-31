import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, Calendar, ChevronRight, CheckCircle2, Circle } from 'lucide-react-native';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Note[]>([]);
  const router = useRouter();
  const { primaryColor, colorScheme, refreshReminderCount } = useCustomTheme();

  const loadReminders = useCallback(async () => {
    const notes = await storage.getNotes();
    const sorted = notes.filter(n => n.reminder).sort((a, b) => {
      // Completed items go to bottom
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(a.reminder!).getTime() - new Date(b.reminder!).getTime();
    });
    setReminders(sorted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const toggleDone = async (id: string) => {
    await storage.toggleCompletion(id);
    await refreshReminderCount();
    loadReminders();
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <Stack.Screen options={{
        title: 'Reminders',
        headerShown: true,
        headerStyle: { backgroundColor: colorScheme === 'dark' ? '#09090b' : '#fafafa' },
        headerTitleStyle: { color: colorScheme === 'dark' ? '#fafafa' : '#09090b', fontWeight: 'bold' },
      }} />

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="mb-4">
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              className={cn(
                "p-4 rounded-[24px] border border-zinc-200 dark:border-zinc-800 flex-row items-center shadow-sm",
                item.color ? "" : "bg-white dark:bg-zinc-900",
                item.isCompleted && "opacity-60"
              )}
              style={item.color ? { backgroundColor: item.color } : {}}
            >
              <Pressable
                onPress={() => toggleDone(item.id)}
                className="mr-4"
              >
                {item.isCompleted ? (
                  <CheckCircle2 size={28} color={primaryColor} />
                ) : (
                  <Circle size={28} color={item.color ? 'rgba(0,0,0,0.2)' : '#d4d4d8'} />
                )}
              </Pressable>

              <View className="flex-1">
                <Text className={cn(
                  "font-bold text-lg",
                  item.color ? "text-black/90" : "text-zinc-900 dark:text-zinc-100",
                  item.isCompleted && "line-through opacity-50"
                )} numberOfLines={1}>
                  {item.title || 'Untitled Note'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color={item.color ? "rgba(0,0,0,0.5)" : "#71717a"} className="mr-1.5" />
                  <Text className={cn(
                    "text-xs font-semibold",
                    item.color ? "text-black/50" : "text-zinc-500"
                  )}>{item.reminder}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={item.color ? "rgba(0,0,0,0.3)" : "#a1a1aa"} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-24 px-10">
            <View className="bg-zinc-100 dark:bg-zinc-900/50 p-12 rounded-full mb-8">
              <Calendar size={64} color="#a1a1aa" />
            </View>
            <Text className="text-zinc-400 dark:text-zinc-500 text-center text-xl font-bold mb-2">
              All caught up!
            </Text>
            <Text className="text-zinc-400 dark:text-zinc-600 text-center text-sm">
              Your scheduled reminders will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
