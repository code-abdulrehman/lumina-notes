import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, Platform } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { NoteCard } from '@/components/NoteCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Settings as SettingsIcon, Menu, Search } from 'lucide-react-native';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { primaryColor, colorScheme } = useCustomTheme();

  const loadNotes = useCallback(async () => {
    const data = await storage.getNotes();
    setNotes(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const filteredNotes = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return notes;
    return notes.filter(n =>
      (n.title?.toLowerCase().includes(query)) ||
      (n.content?.toLowerCase().includes(query))
    );
  }, [notes, search]);

  const leftColumnNotes = filteredNotes.filter((_, i) => i % 2 === 0);
  const rightColumnNotes = filteredNotes.filter((_, i) => i % 2 !== 0);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Modern Search Bar Header */}
      <View className="px-5 pt-4 pb-3">
        <View
          className={cn(
            "flex-row items-center px-4 py-3 rounded-2xl border shadow-sm",
            colorScheme === 'dark'
              ? "bg-zinc-900 border-zinc-800"
              : "bg-white border-zinc-100"
          )}
        >
          <Search size={20} color={colorScheme === 'dark' ? "#71717a" : "#a1a1aa"} />
          <TextInput
            className="flex-1 ml-3 text-zinc-900 dark:text-zinc-100 text-base py-1 font-medium"
            placeholder="Search notes"
            placeholderTextColor={colorScheme === 'dark' ? "#52525b" : "#d4d4d8"}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => router.push('/settings')}
            className="ml-2 w-10 h-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/50"
          >
            <SettingsIcon size={20} color={primaryColor} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-3"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {filteredNotes.length === 0 ? (
          <View className="items-center justify-center mt-32 px-10">
            <View className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full items-center justify-center mb-6">
              <Plus size={40} color={colorScheme === 'dark' ? "#27272a" : "#e4e4e7"} />
            </View>
            <Text className="text-zinc-400 dark:text-zinc-500 text-center text-xl font-bold mb-2">
              {search ? 'Nothing found' : 'Empty Space'}
            </Text>
            <Text className="text-zinc-400 dark:text-zinc-700 text-center text-sm">
              {search ? 'Try searching for something else' : 'Start your journey with a new note'}
            </Text>
          </View>
        ) : (
          <View className="flex-row">
            <View className="flex-1">
              {leftColumnNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </View>
            <View className="flex-1">
              {rightColumnNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <Pressable
        onPress={() => router.push('/note/new')}
        style={{
          backgroundColor: primaryColor,
          ...Platform.select({
            ios: { shadowColor: primaryColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
            android: { elevation: 8 }
          })
        }}
        className="absolute bottom-6 right-6 w-16 h-16 rounded-[22px] items-center justify-center active:scale-90"
      >
        <Plus size={32} color="white" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}
