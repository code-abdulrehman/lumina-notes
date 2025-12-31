import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, Calendar, ChevronRight, CheckCircle2, Circle, Settings as SettingsIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <Stack.Screen options={{ headerShown: false }} />

      {/* Brand Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl overflow-hidden mr-3 shadow-lg">
            <Image
              source={require('@/assets/images/icon.png')}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View>
            <Text className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">
              Lumina
            </Text>
            <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px] -mt-1">
              Reminders
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm"
        >
          <SettingsIcon size={20} color={primaryColor} />
        </Pressable>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="mb-4">
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              className={cn(
                "p-4 rounded-[24px] border border-zinc-200 dark:border-zinc-800 flex-row items-center shadow-sm overflow-hidden",
                !item.bgColor && (!item.bgGradient || item.bgGradient.length === 0) && "bg-white dark:bg-zinc-900",
                item.isCompleted && "opacity-60"
              )}
              style={item.bgColor ? { backgroundColor: item.bgColor } : {}}
            >
              {item.bgGradient && item.bgGradient.length > 1 && (
                <LinearGradient
                  colors={item.bgGradient as [string, string, ...string[]]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Pressable
                onPress={() => toggleDone(item.id)}
                className="mr-4 z-10"
              >
                {item.isCompleted ? (
                  <CheckCircle2 size={28} color={primaryColor} />
                ) : (
                  <Circle size={28} color={(item.bgColor || (item.bgGradient && item.bgGradient.length)) ? 'rgba(0,0,0,0.2)' : '#d4d4d8'} />
                )}
              </Pressable>

              <View className="flex-1 z-10">
                <Text className={cn(
                  "font-bold text-lg",
                  (item.bgColor || (item.bgGradient && item.bgGradient.length)) ? "text-black/90" : "text-zinc-900 dark:text-zinc-100",
                  item.isCompleted && "line-through opacity-50"
                )} numberOfLines={1}>
                  {item.title || 'Untitled Note'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color={(item.bgColor || (item.bgGradient && item.bgGradient.length)) ? "rgba(0,0,0,0.5)" : "#71717a"} className="mr-1.5" />
                  <Text className={cn(
                    "text-xs font-semibold",
                    (item.bgColor || (item.bgGradient && item.bgGradient.length)) ? "text-black/50" : "text-zinc-500"
                  )}>{item.reminder}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={(item.bgColor || (item.bgGradient && item.bgGradient.length)) ? "rgba(0,0,0,0.3)" : "#a1a1aa"} />
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
