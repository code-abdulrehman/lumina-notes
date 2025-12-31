import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from './storage';

const getClient = async () => {
    const settings = await storage.getSettings();
    const key = settings.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    if (!key) {
        throw new Error('Gemini API Key is missing. Please set it in Settings.');
    }
    return new GoogleGenerativeAI(key);
};

export const ai = {
    async generate(prompt: string, text: string) {
        const client = await getClient();
        const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });
        const fullPrompt = `${prompt}\n\nContent:\n${text}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    },

    async summarize(text: string) {
        return this.generate('Summarize the following text concisely:', text);
    },

    async rewrite(text: string) {
        return this.generate('Rewrite the following text to make it more professional and clear:', text);
    },

    async translate(text: string, targetLanguage: string = 'English') {
        return this.generate(`Translate the following text to ${targetLanguage}:`, text);
    },

    async chat(history: { role: 'user' | 'model'; parts: { text: string }[] }[], message: string) {
        const client = await getClient();
        const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });
        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        return response.text();
    },
};
