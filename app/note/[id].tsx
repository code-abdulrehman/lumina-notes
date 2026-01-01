import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { ai } from '@/lib/gemini';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Palette, Trash2, Send, Heading1, Bold, Code, List, Eye, Edit3, Clock, Check, Wand2, AlignLeft, HelpCircle, X, CheckCircle2, Circle, Copy, PlusCircle, RefreshCw, Loader, ExternalLink } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NOTE_COLORS_CONFIG = {
    light: [
        { name: 'None', key: 'none', value: '' },
        { name: 'Red', key: 'red', value: '#fecaca' },
        { name: 'Orange', key: 'orange', value: '#fed7aa' },
        { name: 'Yellow', key: 'yellow', value: '#fef08a' },
        { name: 'Green', key: 'green', value: '#d9f99d' },
        { name: 'Blue', key: 'blue', value: '#bfdbfe' },
    ],
    dark: [
        { name: 'None', key: 'none', value: '' },
        { name: 'Red', key: 'red', value: '#450a0a' },
        { name: 'Orange', key: 'orange', value: '#431407' },
        { name: 'Yellow', key: 'yellow', value: '#422006' },
        { name: 'Green', key: 'green', value: '#064e3b' },
        { name: 'Blue', key: 'blue', value: '#172554' },
    ]
};

const NOTE_GRADIENTS_CONFIG = {
    light: [
        { name: 'Sunset', key: 'sunset', value: ['#fdba74', '#f87171'] },
        { name: 'Emerald', key: 'emerald', value: ['#6ee7b7', '#10b981'] },
        { name: 'Aurora', key: 'aurora', value: ['#fef08a', '#facc15'] },
        { name: 'Coral', key: 'coral', value: ['#ffb3b3', '#ff4d4d'] },
        { name: 'Twilight', key: 'twilight', value: ['#fbcfe8', '#a78bfa'] },
        { name: 'Skyline', key: 'skyline', value: ['#bae6fd', '#0ea5e9'] },
    ],
    dark: [
        { name: 'Sunset', key: 'sunset', value: ['#431407', '#450a0a'] },
        { name: 'Emerald', key: 'emerald', value: ['#064e3b', '#065f46'] },
        { name: 'Aurora', key: 'aurora', value: ['#422006', '#713f12'] },
        { name: 'Coral', key: 'coral', value: ['#450a0a', '#691b1b'] },
        { name: 'Twilight', key: 'twilight', value: ['#4a044e', '#312e81'] },
        { name: 'Skyline', key: 'skyline', value: ['#082f49', '#1e3a8a'] },
    ]
};

const NOTE_PATTERNS = [
    { name: 'None', value: 'none' },
    { name: 'Dots', value: 'dots' },
    { name: 'Lines', value: 'lines' },
    { name: 'Grid', value: 'grid' },
    { name: 'Hex', value: 'hex' },
    { name: 'Circle', value: 'circle' },
    { name: 'Waves', value: 'waves' },
];

const PatternOverlay = ({ pattern }: { pattern?: string }) => {
    if (!pattern || pattern === 'none') return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-[0.1] dark:opacity-[0.15]">
            {pattern === 'dots' && (
                <View className="flex-1 flex-wrap flex-row p-2">
                    {Array(200).fill(0).map((_, i) => (
                        <View key={i} className="w-4 h-4 items-center justify-center">
                            <View className="w-1 h-1 bg-black dark:bg-white rounded-full" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'lines' && (
                <View className="flex-1">
                    {Array(50).fill(0).map((_, i) => (
                        <View key={i} className="h-[1px] bg-black dark:bg-white w-full border-b border-black dark:border-white mb-6 opacity-30" />
                    ))}
                </View>
            )}
            {pattern === 'grid' && (
                <View className="flex-1 flex-wrap flex-row">
                    {Array(150).fill(0).map((_, i) => (
                        <View key={i} className="w-10 h-10 border-[0.5px] border-black dark:border-white opacity-20" />
                    ))}
                </View>
            )}
            {pattern === 'hex' && (
                <View className="flex-1 flex-wrap flex-row p-4">
                    {Array(100).fill(0).map((_, i) => (
                        <View key={i} className="w-8 h-8 items-center justify-center">
                            <View className="w-5 h-5 border border-black dark:border-white rotate-[30deg] opacity-30" style={{ borderRadius: 3 }} />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'circle' && (
                <View className="flex-1 flex-wrap flex-row p-4">
                    {Array(60).fill(0).map((_, i) => (
                        <View key={i} className="w-16 h-16 items-center justify-center">
                            <View className="w-12 h-12 rounded-full border border-black dark:border-white opacity-10" />
                            <View className="w-6 h-6 rounded-full border border-black dark:border-white absolute opacity-20" />
                        </View>
                    ))}
                </View>
            )}
            {pattern === 'waves' && (
                <View className="flex-1 p-4">
                    {Array(30).fill(0).map((_, i) => (
                        <View key={i} className="mb-6 h-6 w-full border-b-2 border-dashed border-black dark:border-white rounded-full opacity-20 rotate-[1deg]" />
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
        bgPattern: 'none',
        reminder: undefined,
    });
    const [isPreview, setIsPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAppearance, setShowAppearance] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [activeAction, setActiveAction] = useState<'summarize' | 'rewrite' | 'explain' | null>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        const content = note.content || '';
        const { start, end } = selection;

        if (start !== end) {
            const selectedText = content.substring(start, end);
            let newText = '';
            if (tag === '#' || tag === '-') {
                newText = content.substring(0, start) + tag + ' ' + selectedText + content.substring(end);
            } else if (tag === '[') {
                newText = content.substring(0, start) + '[' + selectedText + '](url)' + content.substring(end);
            } else {
                newText = content.substring(0, start) + tag + selectedText + tag + content.substring(end);
            }
            setNote(prev => ({ ...prev, content: newText }));
        } else {
            const prefix = content.substring(0, start);
            const suffix = content.substring(start);
            setNote(prev => ({ ...prev, content: prefix + (tag === '[' ? '[text](url)' : tag + ' ') + suffix }));
        }
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
                mediaTypes: ['images'],
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

    const currentColors = colorScheme === 'dark' ? NOTE_COLORS_CONFIG.dark : NOTE_COLORS_CONFIG.light;
    const currentGradients = colorScheme === 'dark' ? NOTE_GRADIENTS_CONFIG.dark : NOTE_GRADIENTS_CONFIG.light;

    const getActiveColor = () => {
        if (!note.bgColor) return 'transparent';
        if (note.bgColor.startsWith('#')) return note.bgColor;
        return currentColors.find(c => c.key === note.bgColor)?.value || 'transparent';
    };

    const getActiveGradient = () => {
        if (!note.bgGradient || note.bgGradient.length === 0) return null;
        if (note.bgGradient[0].startsWith('#')) return note.bgGradient;
        const key = note.bgGradient[0];
        return currentGradients.find(g => g.key === key)?.value || null;
    };

    const activeColor = getActiveColor();
    const activeGradient = getActiveGradient();
    const hasCustomBg = !!(note.bgColor && note.bgColor !== 'none') || !!(note.bgGradient && note.bgGradient.length > 0);

    // Dynamic Contrast Logic
    const textColor = hasCustomBg
        ? (colorScheme === 'dark' ? "text-white" : "text-zinc-900")
        : "text-zinc-900 dark:text-zinc-100";

    const iconColor = hasCustomBg
        ? (colorScheme === 'dark' ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)")
        : "#71717a";

    return (
        <View className={cn("flex-1", !hasCustomBg && (colorScheme === 'dark' ? "bg-zinc-950" : "bg-zinc-50"))} style={{ backgroundColor: activeColor }}>
            {activeGradient && (
                <LinearGradient colors={activeGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
            <PatternOverlay pattern={note.bgPattern} />

            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <View className="flex-row items-center justify-between px-4 py-2 relative z-10">
                    <Pressable onPress={() => router.back()} className="p-2"><ArrowLeft size={24} color={iconColor} /></Pressable>
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

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                    <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 150 }}>
                        <TextInput
                            className={cn("text-3xl font-black mb-4", textColor)}
                            placeholder="Note Title"
                            placeholderTextColor={hasCustomBg ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
                            value={note.title}
                            onChangeText={t => setNote(prev => ({ ...prev, title: t }))}
                        />

                        {isPreview ? (
                            <Markdown style={{ body: { fontSize: 18, color: hasCustomBg ? '#000' : (colorScheme === 'dark' ? '#eee' : '#3f3f46') } }}>{note.content || ''}</Markdown>
                        ) : (
                            <TextInput
                                className={cn("text-lg", hasCustomBg ? "text-zinc-800" : "text-zinc-800 dark:text-zinc-200")}
                                placeholder="Write your thoughts..."
                                placeholderTextColor={hasCustomBg ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
                                multiline
                                scrollEnabled={false}
                                value={note.content}
                                onChangeText={t => setNote(prev => ({ ...prev, content: t }))}
                                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                            />
                        )}

                        {note.media && note.media.length > 0 && (
                            <View className="mt-8 gap-4">
                                {note.media.map((m, i) => (
                                    <View key={i} className="relative rounded-3xl overflow-hidden shadow-lg border border-black/5">
                                        <Pressable onPress={() => setPreviewImage(m.uri)}>
                                            <ExpoImage source={{ uri: m.uri }} className="w-full aspect-video" contentFit="cover" />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setNote(p => ({ ...p, media: p.media?.filter((_, idx) => idx !== i) }))}
                                            className="absolute top-4 right-4 bg-red-500/90 p-2 rounded-full"
                                        >
                                            <Trash2 size={16} color="white" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Toolbar */}
                <View className="px-4 py-3 border-t border-black/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex-row items-center justify-between">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mr-4">
                        <View className="flex-row items-center space-x-6 gap-2">
                            <Pressable onPress={() => insertMarkdown('#')} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><Heading1 size={20} color={iconColor} /></Pressable>
                            <Pressable onPress={() => insertMarkdown('**')} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><Bold size={20} color={iconColor} /></Pressable>
                            <Pressable onPress={() => insertMarkdown('`')} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><Code size={20} color={iconColor} /></Pressable>
                            <Pressable onPress={() => insertMarkdown('-')} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><List size={20} color={iconColor} /></Pressable>
                            <View className="w-[1px] h-6 bg-black/10 mx-2" />
                            <Pressable onPress={pickImage} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><ImageIcon size={20} color={iconColor} /></Pressable>
                            <Pressable onPress={() => setShowAppearance(!showAppearance)} className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><Palette size={20} color={showAppearance ? primaryColor : iconColor} /></Pressable>
                        </View>
                    </ScrollView>
                </View>

                {/* Appearance Menu */}
                {showAppearance && (
                    <View className="absolute bottom-[80px] left-4 right-4 bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="font-black text-xs uppercase tracking-widest text-zinc-400">Appearance</Text>
                            <Pressable onPress={() => setShowAppearance(false)}><X size={18} color="#71717a" /></Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
                            <Text className="text-[10px] font-bold text-zinc-400 mb-4 uppercase">Colors</Text>
                            <View className="flex-row flex-wrap gap-4 mb-8">
                                {currentColors.map(c => (
                                    <Pressable
                                        key={c.key}
                                        onPress={() => setNote(p => ({ ...p, bgColor: c.key, bgGradient: [] }))}
                                        style={{ backgroundColor: c.value || (colorScheme === 'dark' ? '#27272a' : '#f4f4f5'), width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: note.bgColor === c.key ? primaryColor : 'transparent' }}
                                        className="items-center justify-center"
                                    >
                                        {note.bgColor === c.key && <Check size={18} color={primaryColor} />}
                                    </Pressable>
                                ))}
                            </View>

                            <Text className="text-[10px] font-bold text-zinc-400 mb-4 uppercase">Gradients</Text>
                            <View className="flex-row flex-wrap gap-4 mb-8">
                                {currentGradients.map(g => (
                                    <Pressable
                                        key={g.key}
                                        onPress={() => setNote(p => ({ ...p, bgGradient: [g.key], bgColor: '' }))}
                                        className="overflow-hidden"
                                        style={{ width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: note.bgGradient?.[0] === g.key ? primaryColor : 'transparent' }}
                                    >
                                        <LinearGradient colors={g.value as [string, string, ...string[]]} className="flex-1 items-center justify-center">
                                            {note.bgGradient?.[0] === g.key && <Check size={18} color="white" />}
                                        </LinearGradient>
                                    </Pressable>
                                ))}
                            </View>

                            <Text className="text-[10px] font-bold text-zinc-400 mb-4 uppercase">Patterns</Text>
                            <View className="flex-row flex-wrap gap-4">
                                {NOTE_PATTERNS.map(p => (
                                    <Pressable
                                        key={p.name}
                                        onPress={() => setNote(p2 => ({ ...p2, bgPattern: p.value }))}
                                        className="bg-zinc-100 dark:bg-zinc-800 items-center justify-center overflow-hidden"
                                        style={{ width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: note.bgPattern === p.value ? primaryColor : 'transparent' }}
                                    >
                                        {p.value === 'none' ? <X size={18} color="#71717a" /> : <Text className="text-[8px] font-black opacity-40 uppercase">{p.name}</Text>}
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Chat Drawer */}
                {isChatVisible && (
                    <View className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100]">
                        <Pressable className="flex-1" onPress={() => setIsChatVisible(false)} />
                        <View className="bg-white dark:bg-zinc-950 rounded-t-[40px] shadow-2xl overflow-hidden" style={{ height: SCREEN_HEIGHT * 0.8 }}>
                            <View className="h-1.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-4" />
                            <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                <Text className="font-black text-xs tracking-widest text-zinc-400 uppercase">Lumina Assistant</Text>
                                <Pressable onPress={() => setIsChatVisible(false)} className="p-2"><X size={20} color="#71717a" /></Pressable>
                            </View>

                            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                                {chatHistory.map((m, i) => (
                                    <View key={i} className={cn("mb-6", m.role === 'user' ? "items-end" : "items-start")}>
                                        <View className={cn("p-4 rounded-[24px] max-w-[85%]", m.role === 'user' ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800")}>
                                            <Markdown style={{ body: { fontSize: 16, color: colorScheme === 'dark' ? '#eee' : '#3f3f46' } }}>{m.parts[0].text}</Markdown>
                                        </View>
                                    </View>
                                ))}
                                {isAiLoading && <ActivityIndicator color={primaryColor} className="mt-4" />}
                            </ScrollView>

                            <View className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-row items-center pb-10">
                                <TextInput
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 rounded-full dark:text-white"
                                    placeholder="Ask Lumina..."
                                    value={chatMessage}
                                    onChangeText={setChatMessage}
                                />
                                <Pressable onPress={handleChat} className="ml-3 w-12 h-12 rounded-full items-center justify-center bg-zinc-900 dark:bg-zinc-100 shadow-lg">
                                    <Send size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}

                {/* Preview Image Modal */}
                {previewImage && (
                    <View className="absolute inset-0 bg-black/95 z-[200] items-center justify-center">
                        <Pressable onPress={() => setPreviewImage(null)} className="absolute top-12 right-6 p-4 z-50 bg-white/10 rounded-full"><X size={24} color="white" /></Pressable>
                        <ExpoImage source={{ uri: previewImage }} className="w-full h-full" contentFit="contain" />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
