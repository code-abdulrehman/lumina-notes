import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/lib/storage';
import { Trash2, Check, Key, ExternalLink, ChevronRight } from 'lucide-react-native';
import { useCustomTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const PRIMARY_COLORS = [
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Violet', value: '#8b5cf6' },
];

export default function SettingsScreen() {
    const router = useRouter();
    const { primaryColor, setPrimaryColor, geminiApiKey, setGeminiApiKey } = useCustomTheme();
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

    const handleDeleteAll = () => {
        Alert.alert(
            'Delete Everything?',
            'This will permanently remove all your notes. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        await storage.saveNotes([]);
                        Alert.alert('Success', 'Data cleared.');
                        router.replace('/(tabs)');
                    }
                },
            ]
        );
    };

    const handleSaveApiKey = () => {
        setGeminiApiKey(apiKeyInput);
        Alert.alert('Saved', 'AI API Key has been updated.');
    };

    const SettingItem = ({ icon: Icon, title, subtitle, onPress, active, children, danger }: any) => (
        <Pressable
            onPress={onPress}
            className={cn(
                "flex-row items-center px-5 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                active && "bg-zinc-50 dark:bg-zinc-800/50"
            )}
        >
            <View className={cn(
                "w-11 h-11 rounded-2xl items-center justify-center mr-4",
                danger ? "bg-red-50 dark:bg-red-900/20" : "bg-zinc-100 dark:bg-zinc-800"
            )}>
                <Icon size={20} color={danger ? "#ef4444" : (active ? primaryColor : "#71717a")} strokeWidth={active ? 2.5 : 2} />
            </View>
            <View className="flex-1">
                <Text className={cn(
                    "text-base font-bold",
                    danger ? "text-red-600" : "text-zinc-900 dark:text-zinc-100"
                )}>{title}</Text>
                {subtitle && <Text className="text-zinc-500 text-xs mt-0.5">{subtitle}</Text>}
            </View>
            {children || <ChevronRight size={18} color="#d4d4d8" />}
        </Pressable>
    );

    return (
        <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Primary Color Selection */}
                <View className="mt-6">
                    <Text className="px-6 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[2px]">Brand Accent</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white dark:bg-zinc-900 py-6 px-5 mt-2 border-y border-zinc-100 dark:border-zinc-800">
                        <View className="flex-row space-x-5 pr-10">
                            {PRIMARY_COLORS.map((c) => (
                                <Pressable
                                    key={c.value}
                                    onPress={() => setPrimaryColor(c.value)}
                                    style={{ backgroundColor: c.value }}
                                    className="w-14 h-14 rounded-3xl items-center justify-center shadow-md shadow-black/10"
                                >
                                    {primaryColor === c.value && <Check size={26} color="white" strokeWidth={3} />}
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* API Settings */}
                <View className="mt-8">
                    <Text className="px-6 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[2px]">AI Intelligence</Text>
                    <View className="bg-white dark:bg-zinc-900 px-6 py-8 mt-2 border-y border-zinc-100 dark:border-zinc-800">
                        <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl items-center justify-center mr-5">
                                <Key size={22} color="#f59e0b" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-extrabold text-base dark:text-white">Gemini API Key</Text>
                                <Pressable onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')} className="flex-row items-center mt-1">
                                    <Text className="text-blue-500 text-xs font-bold mr-1">Cloud AI Studio Dashboard</Text>
                                    <ExternalLink size={12} color="#3b82f6" />
                                </Pressable>
                            </View>
                        </View>

                        <View className="flex-row items-center space-x-3">
                            <TextInput
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl px-5 py-4 dark:text-white font-mono text-sm shadow-inner"
                                placeholder="..."
                                placeholderTextColor="#71717a"
                                secureTextEntry
                                value={apiKeyInput}
                                onChangeText={setApiKeyInput}
                            />
                            <Pressable
                                onPress={handleSaveApiKey}
                                style={{ backgroundColor: primaryColor }}
                                className="px-6 py-4 rounded-2xl shadow-md active:scale-95 transition-all"
                            >
                                <Text className="text-white font-black uppercase text-xs tracking-widest">Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mt-8">
                    <Text className="px-6 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[2px]">Cloud & Data</Text>
                    <SettingItem
                        icon={Trash2}
                        title="Clear Workspace"
                        subtitle="This action is irreversible"
                        onPress={handleDeleteAll}
                        danger
                    />
                </View>

                {/* App Version Info */}
                <View className="pt-16 pb-20 items-center">
                    <View className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full mb-3">
                        <Text className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black tracking-[4px] uppercase">Lumina Notes</Text>
                    </View>
                    <Text className="text-zinc-400 text-[10px] font-bold">Version 1.2.0 • Premium Edition</Text>
                </View>
            </ScrollView>
        </View>
    );
}
