import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Note } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useCustomTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface NoteCardProps {
    note: Note;
}

const NOTE_COLORS_CONFIG = {
    light: [
        { key: 'red', value: '#fecaca' },
        { key: 'orange', value: '#fed7aa' },
        { key: 'yellow', value: '#fef08a' },
        { key: 'green', value: '#d9f99d' },
        { key: 'blue', value: '#bfdbfe' },
    ],
    dark: [
        { key: 'red', value: '#450a0a' },
        { key: 'orange', value: '#431407' },
        { key: 'yellow', value: '#422006' },
        { key: 'green', value: '#064e3b' },
        { key: 'blue', value: '#172554' },
    ]
};

const NOTE_GRADIENTS_CONFIG = {
    light: [
        { key: 'sunset', value: ['#fdba74', '#f87171'] },
        { key: 'emerald', value: ['#6ee7b7', '#10b981'] },
        { key: 'aurora', value: ['#fef08a', '#facc15'] },
        { key: 'coral', value: ['#ffb3b3', '#ff4d4d'] },
        { key: 'twilight', value: ['#fbcfe8', '#a78bfa'] },
        { key: 'skyline', value: ['#bae6fd', '#0ea5e9'] },
    ],
    dark: [
        { key: 'sunset', value: ['#431407', '#450a0a'] },
        { key: 'emerald', value: ['#064e3b', '#065f46'] },
        { key: 'aurora', value: ['#422006', '#713f12'] },
        { key: 'coral', value: ['#450a0a', '#691b1b'] },
        { key: 'twilight', value: ['#4a044e', '#312e81'] },
        { key: 'skyline', value: ['#082f49', '#1e3a8a'] },
    ]
};

const PatternOverlay = ({ pattern }: { pattern?: string }) => {
    if (!pattern || pattern === 'none') return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-[0.08] dark:opacity-[0.12]">
            {pattern === 'dots' && (
                <View className="flex-1 flex-wrap flex-row p-2">
                    {Array(150).fill(0).map((_, i) => (
                        <View key={i} className="w-4 h-4 items-center justify-center">
                            <View className="w-1 h-1 bg-black dark:bg-white rounded-full" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'lines' && (
                <View className="flex-1">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="h-[1px] bg-black dark:bg-white w-full border-b border-black dark:border-white mb-4 opacity-20" />
                    ))}
                </View>
            )}
            {pattern === 'grid' && (
                <View className="flex-1 flex-wrap flex-row">
                    {Array(100).fill(0).map((_, i) => (
                        <View key={i} className="w-8 h-8 border-[0.5px] border-black dark:border-white opacity-20" />
                    ))}
                </View>
            )}
            {pattern === 'hex' && (
                <View className="flex-1 flex-wrap flex-row p-2">
                    {Array(80).fill(0).map((_, i) => (
                        <View key={i} className="w-6 h-6 items-center justify-center">
                            <View className="w-4 h-4 border border-black dark:border-white rotate-[30deg] opacity-30" style={{ borderRadius: 2 }} />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'circle' && (
                <View className="flex-1 flex-wrap flex-row p-4">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="w-12 h-12 items-center justify-center">
                            <View className="w-8 h-8 rounded-full border border-black dark:border-white opacity-10" />
                            <View className="w-4 h-4 rounded-full border border-black dark:border-white absolute opacity-20" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'waves' && (
                <View className="flex-1 p-2">
                    {Array(20).fill(0).map((_, i) => (
                        <View key={i} className="mb-4 h-4 w-full border-b-2 border-dashed border-black dark:border-white rounded-full opacity-20 rotate-[2deg]" />
                    ))}
                </View>
            )}
        </View>
    );
};

export const NoteCard = ({ note }: NoteCardProps) => {
    const router = useRouter();
    const { primaryColor, colorScheme } = useCustomTheme();
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

    const currentColors = colorScheme === 'dark' ? NOTE_COLORS_CONFIG.dark : NOTE_COLORS_CONFIG.light;
    const currentGradients = colorScheme === 'dark' ? NOTE_GRADIENTS_CONFIG.dark : NOTE_GRADIENTS_CONFIG.light;

    const activeColor = note.bgColor?.startsWith('#')
        ? note.bgColor
        : (currentColors.find(c => c.key === note.bgColor)?.value || null);

    const activeGradient = note.bgGradient?.[0]?.startsWith('#')
        ? note.bgGradient
        : (currentGradients.find(g => g.key === note.bgGradient?.[0])?.value || null);

    const renderBackground = () => {
        if (activeGradient && activeGradient.length > 1) {
            return (
                <LinearGradient
                    colors={activeGradient as [string, string, ...string[]]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-3xl"
                />
            );
        }
        return null;
    };

    const hasCustomBg = !!(note.bgColor && note.bgColor !== 'none') || !!(note.bgGradient && note.bgGradient.length > 0);
    const textColor = hasCustomBg
        ? (colorScheme === 'dark' ? "text-white" : "text-zinc-900")
        : "text-zinc-900 dark:text-zinc-100";

    const subtextColor = hasCustomBg
        ? (colorScheme === 'dark' ? "text-zinc-300" : "text-zinc-700")
        : "text-zinc-500 dark:text-zinc-400";

    const iconColor = hasCustomBg
        ? (colorScheme === 'dark' ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)")
        : "#71717a";

    // Task parsing
    const lines = (note.content || '').split('\n');
    const tasks = lines.filter(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));
    const activeTasks = tasks.filter(t => t.trim().startsWith('- [ ]'));
    const completedTasks = tasks.filter(t => t.trim().startsWith('- [x]'));

    return (
        <View className="p-1.5 w-full">
            <Pressable
                onPress={() => router.push(`/note/${note.id}`)}
                className={cn(
                    "border rounded-[28px] overflow-hidden min-h-[100px] shadow-sm",
                    hasCustomBg ? "border-transparent" : "border-zinc-200 dark:border-zinc-800",
                    !hasCustomBg && (note.isCompleted ? "bg-zinc-100/50 dark:bg-zinc-900/50" : "bg-white dark:bg-zinc-900")
                )}
                style={activeColor ? { backgroundColor: activeColor } : {}}
            >
                {renderBackground()}
                <PatternOverlay pattern={note.bgPattern} />

                <View className="p-5 relative z-10">
                    {note.title ? (
                        <Text className={cn("font-black text-lg mb-2", textColor)} numberOfLines={2}>
                            {note.title}
                        </Text>
                    ) : null}

                    {activeTasks.length > 0 && (
                        <View className="mb-3 space-y-2">
                            {activeTasks.slice(0, 3).map((task, idx) => (
                                <View key={idx} className="flex-row items-center">
                                    <View className="mr-2 opacity-50">
                                        <Square size={14} color={iconColor} strokeWidth={3} />
                                    </View>
                                    <Text className={cn("text-sm font-semibold flex-1", textColor)} numberOfLines={1}>
                                        {task.replace('- [ ]', '').trim()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {note.content && !note.title && activeTasks.length === 0 ? (
                        <View pointerEvents="none" style={{ maxHeight: 100, overflow: 'hidden' }}>
                            <Markdown style={{
                                body: {
                                    color: hasCustomBg
                                        ? (colorScheme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')
                                        : (note.isCompleted ? '#a1a1aa' : (colorScheme === 'dark' ? '#d4d4d8' : '#52525b')),
                                    fontSize: 14,
                                    lineHeight: 20,
                                },
                                paragraph: { marginTop: 0, marginBottom: 4 },
                                heading1: { fontSize: 14, fontWeight: 'bold' },
                                heading2: { fontSize: 13, fontWeight: 'bold' },
                            }}>
                                {note.content}
                            </Markdown>
                        </View>
                    ) : null}

                    {completedTasks.length > 0 && (
                        <View className="mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                            <Text className={cn("text-[10px] font-bold opacity-50", textColor)}>
                                {completedTasks.length} Done
                            </Text>
                        </View>
                    )}

                    <View className="flex-row items-center justify-between mt-4">
                        <Text className={cn("text-[9px] font-bold uppercase tracking-widest", subtextColor)}>
                            {format(note.updatedAt, 'MMM d')}
                        </Text>
                        {note.reminder && (
                            <View className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                <Clock size={10} color={iconColor} />
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
};
