import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, Platform, Image } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { NoteCard } from '@/components/NoteCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Settings as SettingsIcon, Search } from 'lucide-react-native';
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
    let result = notes;
    if (query) {
      result = notes.filter(n =>
        (n.title?.toLowerCase().includes(query)) ||
        (n.content?.toLowerCase().includes(query))
      );
    }
    return [...result].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, search]);

  const leftColumnNotes = filteredNotes.filter((_, i) => i % 2 === 0);
  const rightColumnNotes = filteredNotes.filter((_, i) => i % 2 !== 0);

  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6 pt-8 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl overflow-hidden mr-4 shadow-xl border-2 border-white dark:border-zinc-800">
            <Image
              source={require('@/assets/images/icon.png')}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View>
            <Text className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">
              Lumina
            </Text>
            <View className="flex-row items-center">
              <View className="h-[2px] w-4 bg-zinc-400 mr-2" />
              <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-[3px]">
                Board
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          className="w-12 h-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all active:scale-90"
        >
          <SettingsIcon size={20} color={isDark ? '#fafafa' : '#18181b'} />
        </Pressable>
      </View>

      <View className="px-5 pb-5">
        <View className="flex-row items-center px-4 py-3 rounded-[20px] bg-zinc-200/50 dark:bg-zinc-900/50 border border-transparent dark:border-white/5">
          <Search size={20} color={isDark ? "#71717a" : "#a1a1aa"} />
          <TextInput
            className="flex-1 ml-3 text-zinc-900 dark:text-zinc-100 text-base py-1 font-bold"
            placeholder="Search notes..."
            placeholderTextColor={isDark ? "#52525b" : "#d4d4d8"}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-3"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        {filteredNotes.length === 0 ? (
          <View className="items-center justify-center mt-32 px-10">
            <Text className="text-zinc-400 dark:text-zinc-500 text-center text-xl font-black mb-2">
              {search ? 'NO MATCHES' : 'CLEAN SLATE'}
            </Text>
            <Text className="text-zinc-400 dark:text-zinc-800 text-center text-[10px] uppercase font-bold tracking-widest">
              {search ? 'TRY REFINING YOUR SEARCH' : 'TAP THE PLUS TO BEGIN'}
            </Text>
          </View>
        ) : (
          <View className="flex-row w-full">
            <View className="w-1/2">
              {leftColumnNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </View>
            <View className="w-1/2">
              {rightColumnNotes.map(note => <NoteCard key={note.id} note={note} />)}
            </View>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/note/new')}
        style={{
          backgroundColor: primaryColor,
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 10
        }}
        className="absolute bottom-8 right-8 w-16 h-16 rounded-[24px] items-center justify-center active:scale-95"
      >
        <Plus size={32} color="white" strokeWidth={3} />
      </Pressable>
    </SafeAreaView>
  );
}
