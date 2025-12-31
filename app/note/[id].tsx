import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { storage, Note } from '@/lib/storage';
import { ai } from '@/lib/gemini';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Palette, Trash2, Send, Heading1, Bold, Code, List, Eye, Edit3, Clock, Check, Wand2, AlignLeft, HelpCircle, X, CheckCircle2, Circle, Copy, PlusCircle, RefreshCw } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NOTE_COLORS = [
    { name: 'Default', value: '' },
    { name: 'Red', value: '#f28b82' },
    { name: 'Orange', value: '#fbbc04' },
    { name: 'Yellow', value: '#fff475' },
    { name: 'Green', value: '#ccff90' },
    { name: 'Teal', value: '#a7ffeb' },
    { name: 'Blue', value: '#cbf0f8' },
    { name: 'Navy', value: '#aecbfa' },
    { name: 'Purple', value: '#d7aefb' },
    { name: 'Pink', value: '#fdcfe8' },
    { name: 'Brown', value: '#e6c9a8' },
    { name: 'Gray', value: '#e8eaed' },
];

export default function NoteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { primaryColor, colorScheme, refreshReminderCount } = useCustomTheme();

    const [note, setNote] = useState<Partial<Note>>({
        title: '',
        content: '',
        media: [],
        color: '',
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
        if (id === 'new') {
            await storage.addNote({ title: note.title!, content: note.content!, media: note.media!, color: note.color, reminder: note.reminder });
        } else {
            await storage.updateNote(id!, note);
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
        // Ensure Android DatePicker is called correctly
        try {
            DateTimePickerAndroid.open({
                value: new Date(),
                mode: 'date',
                is24Hour: true,
                onChange: (event, date) => {
                    if (date) {
                        const dateStr = format(date, 'MMM d, yyyy');
                        DateTimePickerAndroid.open({
                            value: date, // Pass selected date to time picker
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

    const themeColors = note.color ? { backgroundColor: note.color } : {};
    const iconColor = note.color ? "rgba(0,0,0,0.6)" : "#71717a";

    return (
        <View className={cn("flex-1", !note.color && (colorScheme === 'dark' ? "bg-zinc-950" : "bg-zinc-50"))} style={themeColors}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2">
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

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                    <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 150 }}>
                        <TextInput
                            className={cn("text-2xl font-bold mb-2", note.color ? "text-black/90" : "text-zinc-900 dark:text-zinc-100")}
                            placeholder="Title"
                            placeholderTextColor={note.color ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
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
                            <Markdown style={{ body: { fontSize: 18, color: note.color ? '#000' : '#3f3f46' } }}>{note.content || ''}</Markdown>
                        ) : (
                            <TextInput
                                className={cn("text-lg", note.color ? "text-black/80" : "text-zinc-800 dark:text-zinc-200")}
                                placeholder="Start typing..."
                                placeholderTextColor={note.color ? "rgba(0,0,0,0.2)" : "#a1a1aa"}
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

                    {/* AI Actions Row - Shrunk Buttons */}
                    {!isPreview && isOnline && (
                        <View className="px-4 py-2 border-t border-black/5 bg-white/30 dark:bg-black/30 flex-row">
                            <Pressable
                                onPress={() => handleAiAction('summarize')}
                                className="flex-row items-center border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-1 mr-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm"
                            >
                                <AlignLeft size={12} color={primaryColor} className="mr-1.5" />
                                <Text className="text-[9px] font-black tracking-tighter" style={{ color: primaryColor }}>SUMMARIZE</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleAiAction('rewrite')}
                                className="flex-row items-center border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-1 mr-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm"
                            >
                                <Wand2 size={12} color={primaryColor} className="mr-1.5" />
                                <Text className="text-[9px] font-black tracking-tighter" style={{ color: primaryColor }}>REWRITE</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleAiAction('explain')}
                                className="flex-row items-center border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-1 mr-2 bg-white/80 dark:bg-zinc-900/80 shadow-sm"
                            >
                                <HelpCircle size={12} color={primaryColor} className="mr-1.5" />
                                <Text className="text-[9px] font-black tracking-tighter" style={{ color: primaryColor }}>EXPLAIN</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Toolbar */}
                    <View className="flex-row items-center px-4 py-3 bg-white/80 dark:bg-zinc-900/80 border-t border-black/5 backdrop-blur-md">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row space-x-6 items-center">
                                <Pressable onPress={() => insertMarkdown('#')}><Heading1 size={22} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('**')}><Bold size={20} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('`')}><Code size={20} color={iconColor} /></Pressable>
                                <Pressable onPress={() => insertMarkdown('-')}><List size={22} color={iconColor} /></Pressable>
                                <View className="w-[1px] h-6 bg-black/10 mx-2" />
                                <Pressable onPress={pickImage}><ImageIcon size={22} color={iconColor} /></Pressable>
                                <Pressable onPress={showDatePicker}><Clock size={22} color={note.reminder ? primaryColor : iconColor} /></Pressable>
                                <Pressable onPress={() => setShowColorPicker(!showColorPicker)}><Palette size={22} color={iconColor} /></Pressable>
                            </View>
                        </ScrollView>
                    </View>

                    {showColorPicker && (
                        <View className="absolute bottom-20 left-0 right-0 p-4 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl">
                            <ScrollView horizontal>
                                <View className="flex-row space-x-3 pb-2">
                                    {NOTE_COLORS.map(c => (
                                        <Pressable key={c.name} onPress={() => { setNote(p => ({ ...p, color: c.value })); setShowColorPicker(false); }}
                                            style={{ backgroundColor: c.value || '#fff', width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: '#eee' }}
                                        >
                                            {note.color === c.value && <Check size={20} color="rgba(0,0,0,0.5)" className="m-auto" />}
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </KeyboardAvoidingView>

                {/* Floating Chat UI */}
                {isChatVisible && (
                    <View
                        style={{ height: SCREEN_HEIGHT * 0.7 }}
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 z-50 rounded-t-[40px] shadow-2xl border-t border-black/5 overflow-hidden"
                    >
                        <SafeAreaView className="flex-1" edges={['bottom']}>
                            <View className="h-1.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full self-center mt-3 mb-2" />
                            <View className="p-4 flex-row justify-between items-center border-b border-zinc-100 dark:border-zinc-800">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-full bg-amber-400 items-center justify-center mr-3">
                                        <Sparkles size={16} color="white" />
                                    </View>
                                    <Text className="font-bold text-lg dark:text-white">Lumina AI</Text>
                                </View>
                                <Pressable onPress={() => setIsChatVisible(false)} className="bg-zinc-100 dark:bg-zinc-800 px-4 py-1.5 rounded-full">
                                    <Text className="text-zinc-600 dark:text-zinc-400 font-bold">Done</Text>
                                </Pressable>
                            </View>
                            <ScrollView className="flex-1 p-5">
                                {chatHistory.length === 0 && (
                                    <View className="items-center justify-center mt-10">
                                        <Text className="text-zinc-400 italic">How can I help with this note?</Text>
                                    </View>
                                )}
                                {chatHistory.map((m, i) => (
                                    <View key={i} className={cn("mb-6", m.role === 'user' ? "items-end" : "items-start")}>
                                        <View className={cn("p-4 rounded-3xl max-w-[85%] shadow-sm", m.role === 'user' ? "bg-zinc-100 dark:bg-amber-900/40" : "bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800")}>
                                            <Markdown style={{ body: { fontSize: 16, color: m.role === 'user' ? (colorScheme === 'dark' ? '#fff' : '#92400e') : (colorScheme === 'dark' ? '#eee' : '#3f3f46') } }}>{m.parts[0].text}</Markdown>

                                            {m.role === 'model' && (
                                                <View className="flex-row items-center space-x-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                    <Pressable
                                                        onPress={async () => {
                                                            await Clipboard.setStringAsync(m.parts[0].text);
                                                            Alert.alert('Copied', 'Text copied to clipboard');
                                                        }}
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <Copy size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1.5" style={{ color: primaryColor }}>COPY</Text>
                                                    </Pressable>

                                                    <Pressable
                                                        onPress={() => {
                                                            setNote(prev => ({ ...prev, content: (prev.content || '') + '\n\n' + m.parts[0].text }));
                                                            setIsChatVisible(false);
                                                            Alert.alert('Appended', 'AI response added to note');
                                                        }}
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <PlusCircle size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1.5" style={{ color: primaryColor }}>APPEND</Text>
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
                                                        className="flex-row items-center bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <RefreshCw size={12} color={primaryColor} />
                                                        <Text className="text-[10px] font-bold ml-1.5" style={{ color: primaryColor }}>REPLACE</Text>
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
                        </SafeAreaView>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
