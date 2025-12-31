import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { ai } from '@/lib/gemini';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Palette, Trash2, Send, Heading1, Bold, Code, List, Eye, Edit3, Clock, Check, Wand2, AlignLeft, HelpCircle, X, CheckCircle2, Circle, Copy, PlusCircle, RefreshCw, Loader } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NOTE_COLORS = [
    { name: 'None', type: 'none', value: '' },
    { name: 'Red', type: 'color', value: '#fecaca' },
    { name: 'Orange', type: 'color', value: '#fed7aa' },
    { name: 'Yellow', type: 'color', value: '#fef08a' },
    { name: 'Green', type: 'color', value: '#d9f99d' },
    { name: 'Blue', type: 'color', value: '#bfdbfe' },
    { name: 'Purple', type: 'color', value: '#ddd6fe' },
];

const NOTE_GRADIENTS = [
    { name: 'Sunset', value: ['#fdba74', '#f87171'] },
    { name: 'Ocean', value: ['#7dd3fc', '#3b82f6'] },
    { name: 'Lumina', value: ['#c4b5fd', '#a78bfa'] },
    { name: 'Emerald', value: ['#6ee7b7', '#10b981'] },
    { name: 'Rose', value: ['#fda4af', '#e11d48'] },
    { name: 'Sky', value: ['#97dff5ff', '#85dcf7ff'] },
];

const NOTE_PATTERNS = [
    { name: 'None', value: 'none' },
    { name: 'Dots', value: 'dots' },
    { name: 'Lines', value: 'lines' },
    { name: 'Grid', value: 'grid' },
    { name: 'Hex', value: 'hex' },
    { name: 'Circle', value: 'circle' },
];

const PatternOverlay = ({ pattern }: { pattern?: string }) => {
    if (!pattern || pattern === 'none') return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-[0.05] dark:opacity-[0.1]">
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
                        <View key={i} className="h-[1px] bg-black dark:bg-white w-full border-b border-black dark:border-white mb-4" />
                    ))}
                </View>
            )}
            {pattern === 'grid' && (
                <View className="flex-1 flex-wrap flex-row">
                    {Array(100).fill(0).map((_, i) => (
                        <View key={i} className="w-8 h-8 border-[0.5px] border-black dark:border-white" />
                    ))}
                </View>
            )}
            {pattern === 'hex' && (
                <View className="flex-1 flex-wrap flex-row p-2">
                    {Array(80).fill(0).map((_, i) => (
                        <View key={i} className="w-6 h-6 items-center justify-center">
                            <View className="w-4 h-4 border border-black dark:border-white rotate-[30deg]" style={{ borderRadius: 2 }} />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'circle' && (
                <View className="flex-1 flex-wrap flex-row p-4">
                    {Array(40).fill(0).map((_, i) => (
                        <View key={i} className="w-12 h-12 items-center justify-center">
                            <View className="w-8 h-8 rounded-full border border-black dark:border-white opacity-20" />
                            <View className="w-4 h-4 rounded-full border border-black dark:border-white absolute" />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export default function NoteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { primaryColor, colorScheme, refreshReminderCount } = useCustomTheme();

    const [note, setNote] = useState<Partial<Note>>({
        title: '',
        content: '',
        media: [],
        bgColor: '',
        bgGradient: [],
        bgPattern: '',
        reminder: undefined,
    });
    const [isPreview, setIsPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [activeAction, setActiveAction] = useState<'summarize' | 'rewrite' | 'explain' | null>(null);

    useEffect(() => {
        if (id && id !== 'new') {
            loadNote();
        }
        checkConnectivity();
    }, [id]);

    const checkConnectivity = async () => {
        const status = await Network.getNetworkStateAsync();
        setIsOnline(!!status.isConnected && !!status.isInternetReachable);
    };

    const loadNote = async () => {
        const notes = await storage.getNotes();
        const found = notes.find((n) => n.id === id);
        if (found) setNote(found);
    };

    const insertMarkdown = (tag: string) => {
        setNote(prev => ({ ...prev, content: (prev.content || '') + '\n' + tag + ' ' }));
    };

    const handleSave = async () => {
        if (!note.title && !note.content) return router.back();
        setIsSaving(true);
        const noteToSave = {
            title: note.title || '',
            content: note.content || '',
            media: note.media || [],
            bgColor: note.bgColor,
            bgGradient: note.bgGradient,
            bgPattern: note.bgPattern,
            reminder: note.reminder,
            isCompleted: note.isCompleted || false
        };

        if (id === 'new') {
            await storage.addNote(noteToSave);
        } else {
            await storage.updateNote(id!, noteToSave);
        }
        setIsSaving(false);
        router.back();
    };

    const handleDelete = () => {
        Alert.alert('Delete?', 'Remove this note permanently?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    if (id !== 'new') await storage.deleteNote(id!);
                    router.back();
                }
            }
        ]);
    };

    const pickImage = async () => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                quality: 0.8,
                allowsMultipleSelection: true
            });
            if (!res.canceled) {
                const newMedia = res.assets.map(asset => ({
                    type: asset.type === 'video' ? 'video' : 'image',
                    uri: asset.uri
                }));
                setNote(prev => ({
                    ...prev,
                    media: [...(prev.media || []), ...newMedia] as any
                }));
            }
        } catch (e) {
            Alert.alert('Media Error', 'Could not access library');
        }
    };

    const showDatePicker = () => {
        try {
            DateTimePickerAndroid.open({
                value: new Date(),
                mode: 'date',
                is24Hour: true,
                onChange: (event, date) => {
                    if (date) {
                        const dateStr = format(date, 'MMM d, yyyy');
                        DateTimePickerAndroid.open({
                            value: date,
                            mode: 'time',
                            is24Hour: true,
                            onChange: (e, time) => {
                                if (time) {
                                    setNote(prev => ({ ...prev, reminder: `${dateStr} at ${format(time, 'HH:mm')}` }));
                                }
                            }
                        });
                    }
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleAiAction = async (action: 'summarize' | 'rewrite' | 'explain') => {
        if (!isOnline) return Alert.alert('Offline', 'AI requires internet');
        if (!note.content) return Alert.alert('Empty', 'Add some content first');

        setActiveAction(action);
        setIsAiLoading(true);
        try {
            let result = '';
            if (action === 'summarize') result = await ai.summarize(note.content);
            else if (action === 'rewrite') result = await ai.rewrite(note.content);
            else if (action === 'explain') result = await ai.generate('Explain the concepts in this note simply:', note.content);

            setIsChatVisible(true);
            setChatHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text: `Lumina, please ${action} this note.` }] },
                { role: 'model', parts: [{ text: result }] }
            ]);
        } catch (e: any) {
            Alert.alert('AI Error', e.message);
        } finally {
            setIsAiLoading(false);
            setActiveAction(null);
        }
    };

    const handleChat = async () => {
        if (!isOnline) return Alert.alert('Offline', 'AI requires internet');
        if (!chatMessage || isAiLoading) return;

        setIsAiLoading(true);
        const userMsg = chatMessage;
        setChatMessage('');
        const newHistory = [...chatHistory, { role: 'user', parts: [{ text: userMsg }] }] as any;
        setChatHistory(newHistory);

        try {
            const resp = await ai.chat(newHistory, `Context: Title: ${note.title}, Content: ${note.content}.\n${userMsg}`);
            setChatHistory([...newHistory, { role: 'model', parts: [{ text: resp }] }]);
        } catch (e: any) { Alert.alert('Error', e.message); }
        finally { setIsAiLoading(false); }
    };

    const hasCustomBg = note.bgColor || (note.bgGradient && note.bgGradient.length > 0);
    const themeColors = note.bgColor ? { backgroundColor: note.bgColor } : {};
    const iconColor = hasCustomBg ? "rgba(0,0,0,0.6)" : "#71717a";

    return (
        <View className={cn("flex-1", !hasCustomBg && (colorScheme === 'dark' ? "bg-zinc-950" : "bg-zinc-50"))} style={themeColors}>
            {note.bgGradient && note.bgGradient.length > 1 && (
                <LinearGradient colors={note.bgGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
            <PatternOverlay pattern={note.bgPattern} />

            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 gap-2 relative z-10">
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2"><ArrowLeft size={24} color={iconColor} /></Pressable>
                    <View className="flex-row items-center space-x-2">
                        {isOnline && (
                            <Pressable onPress={() => setIsChatVisible(true)} className="p-2">
                                <Sparkles size={22} color={primaryColor} />
                            </Pressable>
                        )}
                        <Pressable onPress={() => setIsPreview(!isPreview)} className="p-2">{isPreview ? <Edit3 size={22} color={primaryColor} /> : <Eye size={22} color={iconColor} />}</Pressable>
                        <Pressable onPress={handleSave} className="p-2">{isSaving ? <ActivityIndicator size="small" /> : <Save size={24} color={primaryColor} />}</Pressable>
                        {id !== 'new' && <Pressable onPress={handleDelete} className="p-2"><Trash2 size={22} color="#f43f5e" /></Pressable>}
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 relative z-10">
                    <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 150 }}>
                        <TextInput
                            className={cn("text-2xl font-bold mb-2", hasCustomBg ? "text-black/90" : "text-zinc-900 dark:text-zinc-100")}
                            placeholder="Title"
                            placeholderTextColor={hasCustomBg ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
                            value={note.title}
                            onChangeText={t => setNote(prev => ({ ...prev, title: t }))}
                        />

                        <View className="flex-row items-center mb-4 space-x-2">
                            {note.reminder && (
                                <Pressable onPress={showDatePicker} className="flex-row items-center bg-black/5 px-3 py-1 rounded-full">
                                    <Clock size={12} color={iconColor} className="mr-2" />
                                    <Text className={cn("text-xs font-bold", note.isCompleted && "line-through opacity-50")} style={{ color: iconColor }}>{note.reminder}</Text>
                                    <Pressable onPress={() => setNote(p => ({ ...p, reminder: undefined }))} className="ml-2">
                                        <X size={12} color={iconColor} />
                                    </Pressable>
                                </Pressable>
                            )}

                            {note.reminder && (
                                <Pressable
                                    onPress={async () => {
                                        const newStatus = !note.isCompleted;
                                        setNote(p => ({ ...p, isCompleted: newStatus }));
                                        if (id !== 'new') {
                                            await storage.toggleCompletion(id!);
                                            await refreshReminderCount();
                                        }
                                    }}
                                    className={cn(
                                        "flex-row items-center px-3 py-1 rounded-full border",
                                        note.isCompleted ? "bg-green-100 border-green-200" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                    )}
                                >
                                    {note.isCompleted ? (
                                        <CheckCircle2 size={12} color="#16a34a" className="mr-2" />
                                    ) : (
                                        <Circle size={12} color="#71717a" className="mr-2" />
                                    )}
                                    <Text className={cn("text-[10px] font-bold", note.isCompleted ? "text-green-700" : "text-zinc-600 dark:text-zinc-400")}>
                                        {note.isCompleted ? "COMPLETED" : "MARK AS DONE"}
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {isPreview ? (
                            <Markdown style={{ body: { fontSize: 18, color: hasCustomBg ? '#000' : (colorScheme === 'dark' ? '#fff' : '#3f3f46') } }}>{note.content || ''}</Markdown>
                        ) : (
                            <TextInput
                                className={cn("text-lg ", hasCustomBg ? "text-black/80" : "text-zinc-800 dark:text-zinc-200")}
                                placeholder="Start typing..."
                                placeholderTextColor={hasCustomBg ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
                                multiline
                                value={note.content}
                                onChangeText={t => setNote(prev => ({ ...prev, content: t }))}
                            />
                        )}

                        {note.media && note.media.length > 0 && (
                            <View className="flex-row flex-wrap mt-6">
                                {note.media.map((m, i) => (
                                    <View key={i} className="w-full mb-3 shadow-sm relative">
                                        <Image source={{ uri: m.uri }} className="w-full aspect-video rounded-3xl bg-black/5" />
                                        <Pressable
                                            onPress={() => setNote(p => ({ ...p, media: p.media?.filter((_, idx) => idx !== i) }))}
                                            className="absolute top-3 right-3 bg-red-500/80 p-2 rounded-full"
                                        >
                                            <Trash2 size={16} color="white" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* AI Actions Row */}
                    {!isPreview && isOnline && (
                        <View className="px-4 py-2 border-t border-black/5 bg-white/30 dark:bg-black/30 flex-row">
                            {(['summarize', 'rewrite', 'explain'] as const).map((action) => (
                                <Pressable
                                    key={action}
                                    onPress={() => handleAiAction(action)}
                                    disabled={isAiLoading}
                                    className={cn(
                                        "flex-row gap-1 items-center border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1 mr-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm",
                                        activeAction === action && "opacity-50"
                                    )}
                                >
                                    {activeAction === action ? (
                                        <Loader size={12} color={primaryColor} className="mr-1.5 animate-spin" />
                                    ) : (
                                        action === 'summarize' ? <AlignLeft size={12} color={primaryColor} className="mr-1.5" /> :
                                            action === 'rewrite' ? <Wand2 size={12} color={primaryColor} className="mr-1.5" /> :
                                                <HelpCircle size={12} color={primaryColor} className="mr-1.5" />
                                    )}
                                    <Text className="text-[9px] font-black tracking-tighter" style={{ color: primaryColor }}>{action.toUpperCase()}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Toolbar */}
                    <View className="flex-row items-center px-4 py-3 bg-white/80 dark:bg-zinc-900/80 border-t border-black/5 backdrop-blur-md">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row space-x-6 items-center gap-3">
                                <Pressable onPress={() => insertMarkdown('#')} className="p-1 bg-black/5 rounded-md"><Heading1 size={22} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('**')} className="p-1 bg-black/5 rounded-md"><Bold size={20} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('`')} className="p-1 bg-black/5 rounded-md"><Code size={20} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('-')} className="p-1 bg-black/5 rounded-md"><List size={22} color={iconColor} /></Pressable>
                                <View className="w-[1px] h-6 bg-black/10 mx-2" />
                                <Pressable onPress={pickImage} className="p-1 bg-black/5 rounded-md"><ImageIcon size={22} color={iconColor} /></Pressable>
                                <Pressable onPress={showDatePicker} className="p-1 bg-black/5 rounded-md"><Clock size={22} color={note.reminder ? primaryColor : iconColor} /></Pressable>
                                <Pressable onPress={() => setShowColorPicker(!showColorPicker)} className="p-1 bg-black/5 rounded-md"><Palette size={22} color={iconColor} /></Pressable>
                            </View>
                        </ScrollView>
                    </View>

                    {showColorPicker && (
                        <View className="absolute bottom-12 left-0 right-0 p-6 bg-white dark:bg-zinc-900 rounded-t-[40px] shadow-2xl border-t border-zinc-100 dark:border-zinc-800">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">Note Appearance</Text>
                                <Pressable onPress={() => setShowColorPicker(false)}><X size={18} color="#71717a" /></Pressable>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[300px]">
                                <Text className="text-[9px] font-bold text-zinc-400 mb-3 uppercase">Solid Colors</Text>
                                <View className="flex-row flex-wrap gap-3 mb-6">
                                    {NOTE_COLORS.map(c => (
                                        <Pressable
                                            key={c.name}
                                            onPress={() => setNote(p => ({ ...p, bgColor: c.value, bgGradient: [], bgPattern: p.bgPattern }))}
                                            style={{ backgroundColor: c.value || (colorScheme === 'dark' ? '#27272a' : '#f4f4f5'), width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: note.bgColor === c.value && !note.bgGradient?.length ? primaryColor : 'transparent' }}
                                            className="flex-1 items-center justify-center max-w-12 max-h-12 rounded-2xl"
                                        >
                                            {note.bgColor === c.value && !note.bgGradient?.length && <Check size={18} color={primaryColor} className="m-auto" />}
                                        </Pressable>
                                    ))}
                                </View>

                                <Text className="text-[9px] font-bold text-zinc-400 mb-3 uppercase">Gradients</Text>
                                <View className="flex-row flex-wrap gap-3 mb-6">
                                    {NOTE_GRADIENTS.map(g => (
                                        <Pressable
                                            key={g.name}
                                            onPress={() => setNote(p => ({ ...p, bgGradient: g.value, bgColor: '', bgPattern: p.bgPattern }))}
                                            className="overflow-hidden"
                                            style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: JSON.stringify(note.bgGradient) === JSON.stringify(g.value) ? primaryColor : 'transparent' }}
                                        >
                                            <LinearGradient colors={g.value as [string, string, ...string[]]} className="flex-1 items-center justify-center max-w-12 max-h-12 rounded-2xl">
                                                {JSON.stringify(note.bgGradient) === JSON.stringify(g.value) && <Check size={18} color="white" />}
                                            </LinearGradient>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text className="text-[9px] font-bold text-zinc-400 mb-3 uppercase">Patterns</Text>
                                <View className="flex-row flex-wrap gap-3 mb-2">
                                    {NOTE_PATTERNS.map(p => (
                                        <Pressable
                                            key={p.name}
                                            onPress={() => setNote(prev => ({ ...prev, bgPattern: p.value }))}
                                            className="bg-zinc-100 dark:bg-zinc-800 items-center justify-center overflow-hidden"
                                            style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: (note.bgPattern === p.value || (!note.bgPattern && p.value === 'none')) ? primaryColor : 'transparent' }}
                                        >
                                            {p.value === 'none' ? (
                                                <X size={18} color="#71717a" />
                                            ) : (
                                                <>
                                                    <PatternOverlay pattern={p.value} />
                                                    <Text className="text-[8px] font-black text-zinc-500 uppercase">{p.name}</Text>
                                                </>
                                            )}
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </KeyboardAvoidingView>

                {/* Floating Chat UI */}
                {isChatVisible && (
                    <View className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50">
                        <Pressable className="flex-1" onPress={() => setIsChatVisible(false)} />
                        <View
                            className="bg-white dark:bg-zinc-950 rounded-t-[40px] shadow-2xl border-t border-zinc-100 dark:border-zinc-800"
                            style={{ height: SCREEN_HEIGHT * 0.75 }}
                        >
                            {/* Drawer Handle */}
                            <View className="items-center pt-3 pb-1">
                                <View className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                            </View>

                            {/* Chat Header */}
                            <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }} />
                                    <Text className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">Lumina Intelligence</Text>
                                </View>
                                <Pressable
                                    onPress={() => setIsChatVisible(false)}
                                    className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 items-center justify-center active:scale-90 transition-all"
                                >
                                    <X size={18} color="#71717a" />
                                </Pressable>
                            </View>

                            <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
                                {chatHistory.length === 0 && (
                                    <View className="items-center justify-center mt-10">
                                        <Text className="text-zinc-400 italic">How can I help with this note?</Text>
                                    </View>
                                )}
                                {chatHistory.map((m, i) => (
                                    <View key={i} className={cn("mb-6", m.role === 'user' ? "items-end" : "items-start")}>
                                        <View className={cn("px-2 rounded-3xl ", m.role === 'user' ? "bg-zinc-100 dark:bg-amber-900/40 shadow-sm max-w-[85%]" : "bg-white dark:bg-black max-w-[90%]")}>
                                            <Markdown style={{ body: { fontSize: 16, color: m.role === 'user' ? (colorScheme === 'dark' ? '#fff' : '#92400e') : (colorScheme === 'dark' ? '#eee' : '#3f3f46') } }}>{m.parts[0].text}</Markdown>

                                            {m.role === 'model' && (
                                                <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                    <Pressable
                                                        onPress={async () => {
                                                            await Clipboard.setStringAsync(m.parts[0].text);
                                                            Alert.alert('Copied', 'Text copied to clipboard');
                                                        }}
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <Copy size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1" style={{ color: primaryColor }}>COPY</Text>
                                                    </Pressable>

                                                    <Pressable
                                                        onPress={() => {
                                                            setNote(prev => ({ ...prev, content: (prev.content || '') + '\n\n' + m.parts[0].text }));
                                                            setIsChatVisible(false);
                                                            Alert.alert('Appended', 'AI response added to note');
                                                        }}
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <PlusCircle size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1" style={{ color: primaryColor }}>APPEND</Text>
                                                    </Pressable>

                                                    <Pressable
                                                        onPress={() => {
                                                            Alert.alert('Replace Content?', 'This will overwrite your existing note.', [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Replace', style: 'destructive', onPress: () => {
                                                                        setNote(prev => ({ ...prev, content: m.parts[0].text }));
                                                                        setIsChatVisible(false);
                                                                    }
                                                                }
                                                            ]);
                                                        }}
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <RefreshCw size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1" style={{ color: primaryColor }}>REPLACE</Text>
                                                    </Pressable>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                                {isAiLoading && <ActivityIndicator color={primaryColor} size="large" className="my-4" />}
                            </ScrollView>

                            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <View className="p-4 flex-row items-center border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-8">
                                    <TextInput
                                        className="flex-1 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 rounded-full mr-3 dark:text-white"
                                        placeholder="Ask anything..."
                                        placeholderTextColor="#a1a1aa"
                                        value={chatMessage}
                                        onChangeText={setChatMessage}
                                    />
                                    <Pressable
                                        onPress={handleChat}
                                        style={{ backgroundColor: primaryColor }}
                                        className="w-12 h-12 rounded-full items-center justify-center shadow-lg active:scale-95"
                                    >
                                        <Send size={20} color="white" />
                                    </Pressable>
                                </View>
                            </KeyboardAvoidingView>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
