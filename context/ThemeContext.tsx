import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { storage } from '@/lib/storage';

type ThemeContextType = {
    primaryColor: string;
    geminiApiKey: string;
    reminderCount: number;
    setPrimaryColor: (color: string) => void;
    setGeminiApiKey: (key: string) => void;
    refreshReminderCount: () => Promise<void>;
    colorScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceColorScheme = useDeviceColorScheme();
    const [reminderCount, setReminderCount] = useState(0);
    const [settings, setSettings] = useState({
        primaryColor: '#fbbf24',
        geminiApiKey: '',
    });

    useEffect(() => {
        loadSettings();
        refreshReminderCount();
    }, []);

    const loadSettings = async () => {
        const s = await storage.getSettings();
        setSettings({
            primaryColor: s.primaryColor || '#fbbf24',
            geminiApiKey: s.geminiApiKey || '',
        });
    };

    const refreshReminderCount = async () => {
        const count = await storage.getPendingRemindersCount();
        setReminderCount(count);
    };

    const setPrimaryColor = async (color: string) => {
        setSettings(prev => ({ ...prev, primaryColor: color }));
        const currentSettings = await storage.getSettings();
        await storage.saveSettings({ ...currentSettings, primaryColor: color });
    };

    const setGeminiApiKey = async (key: string) => {
        setSettings(prev => ({ ...prev, geminiApiKey: key }));
        const currentSettings = await storage.getSettings();
        await storage.saveSettings({ ...currentSettings, geminiApiKey: key });
    };

    // Forced Auto-Theme based on System
    const colorScheme = deviceColorScheme || 'light';

    return (
        <ThemeContext.Provider value={{
            primaryColor: settings.primaryColor,
            geminiApiKey: settings.geminiApiKey,
            reminderCount,
            setPrimaryColor,
            setGeminiApiKey,
            refreshReminderCount,
            colorScheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useCustomTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useCustomTheme must be used within a ThemeProvider');
    return context;
};
