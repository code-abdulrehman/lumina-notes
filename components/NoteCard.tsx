import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
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

const PatternOverlay = ({ pattern }: { pattern?: string }) => {
    if (!pattern || pattern === 'none') return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-[0.08] dark:opacity-[0.15]">
            {pattern === 'dots' && (
                <View className="flex-1 flex-wrap flex-row p-1">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="w-4 h-4 items-center justify-center">
                            <View className="w-1 h-1 bg-black dark:bg-white rounded-full" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'stars' && (
                <View className="flex-1 overflow-hidden">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i}
                            style={{
                                position: 'absolute',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: Math.random() * 2 + 0.5,
                                height: Math.random() * 2 + 0.5,
                                borderRadius: 10,
                                backgroundColor: i % 2 === 0 ? '#71717a' : '#ffffff',
                                opacity: Math.random() * 0.4 + 0.1
                            }}
                        />
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
                    {Array(50).fill(0).map((_, i) => (
                        <View key={i} className="w-6 h-6 border-[0.2px] border-black dark:border-white" />
                    ))}
                </View>
            )}
            {pattern === 'hex' && (
                <View className="flex-1 flex-wrap flex-row p-1">
                    {Array(40).fill(0).map((_, i) => (
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
            {pattern === 'waves' && (
                <View className="flex-1 p-2">
                    {Array(15).fill(0).map((_, i) => (
                        <View key={i} className="mb-2 h-2 w-full border-b border-dashed border-black dark:border-white rounded-full opacity-30 rotate-[2deg]" />
                    ))}
                </View>
            )}
        </View>
    );
};

export const NoteCard = ({ note }: NoteCardProps) => {
    const router = useRouter();
    const { primaryColor } = useCustomTheme();
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

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
    const textColor = hasCustomBg ? "text-black/90" : "text-zinc-900 dark:text-zinc-100";
    const subtextColor = hasCustomBg ? "text-black/60" : "text-zinc-500 dark:text-zinc-400";
    const iconColor = hasCustomBg ? "rgba(0,0,0,0.4)" : "#71717a";

    // Task parsing logic
    const lines = (note.content || '').split('\n');
    const tasks = lines.filter(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));
    const nonTasks = lines.filter(l => !tasks.includes(l)).join('\n').trim();

    const activeTasks = tasks.filter(t => t.trim().startsWith('- [ ]'));
    const completedTasks = tasks.filter(t => t.trim().startsWith('- [x]'));

    return (
        <View className="p-1.5 w-full">
            <Pressable
                onPress={() => router.push(`/note/${note.id}`)}
                className={cn(
                    "border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm min-h-[60px] overflow-hidden",
                    !hasCustomBg && (note.isCompleted ? "bg-zinc-100/50 dark:bg-zinc-900/50" : "bg-white dark:bg-zinc-900")
                )}
                style={note.bgColor ? { backgroundColor: note.bgColor } : {}}
            >
                {renderBackground()}
                <PatternOverlay pattern={note.bgPattern} />

                <View className="relative z-10">
                    <View className="flex-row items-center justify-between mb-3">
                        {note.title ? (
                            <Text
                                className={cn("font-black text-lg flex-1 mr-2", textColor)}
                                numberOfLines={2}
                            >
                                {note.title}
                            </Text>
                        ) : null}
                    </View>

                    {/* Active Tasks First */}
                    {activeTasks.length > 0 && (
                        <View className="mb-4 space-y-2.5">
                            {activeTasks.slice(0, 5).map((task, idx) => (
                                <View key={idx} className="flex-row items-center">
                                    <View className="mr-3 opacity-60">
                                        <Square size={16} color={iconColor} strokeWidth={2.5} />
                                    </View>
                                    <Text className={cn("text-base font-medium flex-1", textColor)} numberOfLines={1}>
                                        {task.replace('- [ ]', '').trim()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Markdown Content Preview */}
                    {note.content ? (
                        <View pointerEvents="none" style={{ maxHeight: 150, overflow: 'hidden' }} className="mb-4">
                            <Markdown style={{
                                body: {
                                    color: hasCustomBg ? 'rgba(0,0,0,0.7)' : (note.isCompleted ? '#a1a1aa' : '#7b7280'),
                                    fontSize: 14,
                                    lineHeight: 20,
                                },
                                paragraph: { marginTop: 0, marginBottom: 4 },
                                heading1: { fontSize: 16, fontWeight: 'bold' },
                                code_inline: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, paddingHorizontal: 2 },
                                bullet_list: { marginTop: 0 },
                                list_item: { marginBottom: 2 },
                            }}>
                                {note.content}
                            </Markdown>
                            {/* Suble fade out for long content */}
                            <LinearGradient
                                colors={['transparent', hasCustomBg ? note.bgColor || '#fff' : (note.isCompleted ? 'rgba(244,244,245,0.8)' : 'rgba(255,255,255,0.8)')]}
                                className="absolute bottom-0 left-0 right-0 h-8"
                                style={!hasCustomBg && { opacity: 0.1 }}
                            />
                        </View>
                    ) : null}

                    {/* Collapsible Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <View className="mt-2 border-t border-black/5 dark:border-white/5 pt-3">
                            <Pressable
                                onPress={() => setIsCompletedExpanded(!isCompletedExpanded)}
                                className="flex-row items-center mb-2"
                            >
                                {isCompletedExpanded ? <ChevronUp size={14} color={iconColor} /> : <ChevronDown size={14} color={iconColor} />}
                                <Text className={cn("text-xs font-bold ml-2", subtextColor)}>
                                    {completedTasks.length} Completed items
                                </Text>
                            </Pressable>

                            {isCompletedExpanded && (
                                <View className="space-y-2 pl-1">
                                    {completedTasks.map((task, idx) => (
                                        <View key={idx} className="flex-row items-center opacity-40">
                                            <View className="mr-3">
                                                <CheckSquare size={16} color={iconColor} strokeWidth={2} />
                                            </View>
                                            <Text className={cn("text-sm line-through flex-1", textColor)} numberOfLines={1}>
                                                {task.replace('- [x]', '').trim()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {note.media && note.media.length > 0 && (
                        <View className="mt-4 rounded-2xl overflow-hidden bg-black/5 flex-row">
                            {note.media.slice(0, 3).map((m, i) => (
                                <Image
                                    key={i}
                                    source={{ uri: m.uri }}
                                    className="h-20 flex-1 border-r border-white/10 bg-zinc-200 dark:bg-zinc-800"
                                />
                            ))}
                        </View>
                    )}

                    {/* Decorative bottom-right circle element like in image */}
                    {hasCustomBg && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: -20,
                                right: -20,
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: hasCustomBg ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                zIndex: -1
                            }}
                        />
                    )}

                    <View className="flex-row items-center justify-between mt-4">
                        <Text className={cn("text-[10px] font-bold uppercase tracking-widest", subtextColor)}>
                            {format(note.updatedAt, 'MMM d')}
                        </Text>
                        {note.reminder && (
                            <View style={{ borderColor: hasCustomBg ? 'rgba(0,0,0,0.1)' : primaryColor + '20' }} className="flex-row items-center bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full border">
                                <Clock size={10} color={hasCustomBg ? "rgba(0,0,0,0.4)" : primaryColor} style={{ marginRight: 4 }} />
                                <Text className={cn("text-[9px] font-black", hasCustomBg ? "text-black/50" : "dark:text-zinc-300")} style={!hasCustomBg ? { color: primaryColor } : {}}>
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
