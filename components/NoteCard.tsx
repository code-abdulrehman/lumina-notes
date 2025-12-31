import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Note } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useCustomTheme } from '@/context/ThemeContext';

interface NoteCardProps {
    note: Note;
}

export const NoteCard = ({ note }: NoteCardProps) => {
    const router = useRouter();
    const { primaryColor } = useCustomTheme();

    return (
        <View className="p-1.5 w-full">
            <Pressable
                onPress={() => router.push(`/note/${note.id}`)}
                className={cn(
                    "border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm min-h-[80px]",
                    !note.color && "bg-white dark:bg-zinc-900"
                )}
                style={note.color ? { backgroundColor: note.color } : {}}
            >
                {note.title ? (
                    <Text
                        className={cn(
                            "font-bold text-base mb-2",
                            note.color ? "text-black/90" : "text-zinc-900 dark:text-zinc-100"
                        )}
                        numberOfLines={2}
                    >
                        {note.title}
                    </Text>
                ) : null}

                <View pointerEvents="none" className="mb-2">
                    <Markdown style={{
                        body: {
                            color: note.color ? 'rgba(0,0,0,0.7)' : '#7b7280',
                            fontSize: 13,
                            lineHeight: 18,
                        },
                        paragraph: { marginTop: 0, marginBottom: 4 },
                        heading1: { fontSize: 16, fontWeight: 'bold' },
                        code_inline: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, paddingHorizontal: 2 },
                        bullet_list: { marginTop: 0 },
                    }}>
                        {note.content}
                    </Markdown>
                </View>

                {note.media && note.media.length > 0 && (
                    <View className="mb-3 rounded-xl overflow-hidden bg-black/5 flex-row">
                        {note.media.slice(0, 3).map((m, i) => (
                            <Image
                                key={i}
                                source={{ uri: m.uri }}
                                className="h-16 flex-1 border-r border-white/20 bg-zinc-100 dark:bg-zinc-800"
                            />
                        ))}
                    </View>
                )}

                <View className="flex-row items-center justify-between mt-1">
                    <Text className={cn(
                        "text-[10px]",
                        note.color ? "text-black/40" : "text-zinc-400 dark:text-zinc-500"
                    )}>
                        {format(note.updatedAt, 'MMM d')}
                    </Text>
                    {note.reminder && (
                        <View style={{ borderColor: note.color ? 'rgba(0,0,0,0.1)' : primaryColor + '20' }} className="flex-row items-center bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border">
                            <Clock size={10} color={note.color ? "rgba(0,0,0,0.4)" : primaryColor} style={{ marginRight: 3 }} />
                            <Text className={cn("text-[9px] font-bold", note.color ? "text-black/40" : "dark:text-zinc-300")} style={!note.color ? { color: primaryColor } : {}}>
                                {note.reminder.split(' at ')[1] || note.reminder.split(', ')[1]}
                            </Text>
                        </View>
                    )}
                </View>
            </Pressable>
        </View>
    );
};
