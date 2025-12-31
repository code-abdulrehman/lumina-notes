import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Note } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useCustomTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface NoteCardProps {
    note: Note;
}

const PatternOverlay = ({ pattern }: { pattern?: string }) => {
    if (!pattern || pattern === 'none') return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-[0.05] dark:opacity-[0.1]">
            {pattern === 'dots' && (
                <View className="flex-1 flex-wrap flex-row p-1">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="w-4 h-4 items-center justify-center">
                            <View className="w-1 h-1 bg-black dark:bg-white rounded-full" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'lines' && (
                <View className="flex-1">
                    {Array(20).fill(0).map((_, i) => (
                        <View key={i} className="h-[1px] bg-black dark:bg-white w-full border-b border-black dark:border-white mb-2" />
                    ))}
                </View>
            )}
            {pattern === 'grid' && (
                <View className="flex-1 flex-wrap flex-row">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="w-6 h-6 border-[0.2px] border-black dark:border-white" />
                    ))}
                </View>
            )}
            {pattern === 'hex' && (
                <View className="flex-1 flex-wrap flex-row p-1">
                    {Array(30).fill(0).map((_, i) => (
                        <View key={i} className="w-6 h-6 items-center justify-center">
                            <View className="w-4 h-4 border border-black dark:border-white rotate-[30deg]" style={{ borderRadius: 2 }} />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'circle' && (
                <View className="flex-1 flex-wrap flex-row p-2">
                    {Array(15).fill(0).map((_, i) => (
                        <View key={i} className="w-10 h-10 items-center justify-center">
                            <View className="w-6 h-6 rounded-full border border-black dark:border-white opacity-20" />
                            <View className="w-2 h-2 rounded-full border border-black dark:border-white absolute" />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export const NoteCard = ({ note }: NoteCardProps) => {
    const router = useRouter();
    const { primaryColor } = useCustomTheme();

    const renderBackground = () => {
        if (note.bgGradient && note.bgGradient.length > 1) {
            return (
                <LinearGradient
                    colors={note.bgGradient as [string, string, ...string[]]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl"
                />
            );
        }
        return null;
    };

    const hasCustomBg = note.bgColor || (note.bgGradient && note.bgGradient.length > 0);

    return (
        <View className="p-1.5 w-full">
            <Pressable
                onPress={() => router.push(`/note/${note.id}`)}
                className={cn(
                    "border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm min-h-[80px] overflow-hidden",
                    !hasCustomBg && "bg-white dark:bg-zinc-900"
                )}
                style={note.bgColor ? { backgroundColor: note.bgColor } : {}}
            >
                {renderBackground()}
                <PatternOverlay pattern={note.bgPattern} />

                <View className="relative z-10">
                    {note.title ? (
                        <Text
                            className={cn(
                                "font-bold text-base mb-2",
                                hasCustomBg ? "text-black/90" : "text-zinc-900 dark:text-zinc-100"
                            )}
                            numberOfLines={2}
                        >
                            {note.title}
                        </Text>
                    ) : null}

                    <View pointerEvents="none" className="mb-2">
                        <Markdown style={{
                            body: {
                                color: hasCustomBg ? 'rgba(0,0,0,0.7)' : '#7b7280',
                                fontSize: 13,
                                lineHeight: 18,
                            },
                            paragraph: { marginTop: 0, marginBottom: 4 },
                            heading1: { fontSize: 16, fontWeight: 'bold' },
                            code_inline: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, paddingHorizontal: 2 },
                            bullet_list: { marginTop: 0 },
                        }}>
                            {note.content || ''}
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
                            hasCustomBg ? "text-black/40" : "text-zinc-400 dark:text-zinc-500"
                        )}>
                            {format(note.updatedAt, 'MMM d')}
                        </Text>
                        {note.reminder && (
                            <View style={{ borderColor: hasCustomBg ? 'rgba(0,0,0,0.1)' : primaryColor + '20' }} className="flex-row items-center bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border">
                                <Clock size={10} color={hasCustomBg ? "rgba(0,0,0,0.4)" : primaryColor} style={{ marginRight: 3 }} />
                                <Text className={cn("text-[9px] font-bold", hasCustomBg ? "text-black/40" : "dark:text-zinc-300")} style={!hasCustomBg ? { color: primaryColor } : {}}>
                                    {note.reminder.split(' at ')[1] || note.reminder.split(', ')[1]}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
};
