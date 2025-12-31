import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;
    isPinned?: boolean;
    reminder?: string;
    isCompleted?: boolean;
    createdAt: number;
    updatedAt: number;
    media?: {
        type: 'image' | 'video' | 'audio' | 'file';
        uri: string;
    }[];
}

const NOTES_KEY = '@lumina_notes';
const SETTINGS_KEY = '@lumina_settings';

export interface AppSettings {
    primaryColor: string;
    geminiApiKey?: string;
}

export const storage = {
    async getNotes(): Promise<Note[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(NOTES_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch notes', e);
            return [];
        }
    },

    async saveNotes(notes: Note[]) {
        try {
            const jsonValue = JSON.stringify(notes);
            await AsyncStorage.setItem(NOTES_KEY, jsonValue);
        } catch (e) {
            console.error('Failed to save notes', e);
        }
    },

    async addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
        const notes = await this.getNotes();
        const newNote: Note = {
            ...note,
            id: Math.random().toString(36).substring(7),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isCompleted: false,
        };
        await this.saveNotes([newNote, ...notes]);
        return newNote;
    },

    async updateNote(id: string, updates: Partial<Note>) {
        const notes = await this.getNotes();
        const newNotes = notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        );
        await this.saveNotes(newNotes);
    },

    async deleteNote(id: string) {
        const notes = await this.getNotes();
        const newNotes = notes.filter((n) => n.id !== id);
        await this.saveNotes(newNotes);
    },

    async toggleCompletion(id: string) {
        const notes = await this.getNotes();
        const newNotes = notes.map((n) =>
            n.id === id ? { ...n, isCompleted: !n.isCompleted, updatedAt: Date.now() } : n
        );
        await this.saveNotes(newNotes);
    },

    async getPendingRemindersCount(): Promise<number> {
        const notes = await this.getNotes();
        return notes.filter(n => n.reminder && !n.isCompleted).length;
    },

    // Settings Storage
    async getSettings(): Promise<AppSettings> {
        try {
            const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
            if (jsonValue != null) {
                const settings = JSON.parse(jsonValue);
                // Remove legacy themeMode if exists
                delete settings.themeMode;
                return settings;
            }
            return { primaryColor: '#fbbf24' };
        } catch (e) {
            return { primaryColor: '#fbbf24' };
        }
    },

    async saveSettings(settings: AppSettings) {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }
};
