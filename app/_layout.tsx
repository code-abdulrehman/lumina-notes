import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useCustomTheme } from '@/context/ThemeContext';
import { View, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import "../global.css";

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme, primaryColor } = useCustomTheme();

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#09090b', // zinc-950
      card: '#09090b',
      text: '#fafafa',
      primary: primaryColor,
      border: '#27272a', // zinc-800
    },
  };

  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#fafafa', // zinc-50
      card: '#ffffff',
      text: '#09090b',
      primary: primaryColor,
      border: '#f4f4f5', // zinc-100
    },
  };

  return (
    <View className={cn("flex-1 pb-12", colorScheme === 'dark' ? 'dark bg-zinc-950' : 'bg-zinc-50')}>
      <NavigationThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <StackScreenContent colorScheme={colorScheme} />
      </NavigationThemeProvider>
    </View>
  );
}

function StackScreenContent({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colorScheme === 'dark' ? '#09090b' : '#fafafa' },
      headerTitleStyle: { color: colorScheme === 'dark' ? '#fafafa' : '#09090b', fontWeight: 'bold' },
      headerTintColor: colorScheme === 'dark' ? '#fafafa' : '#09090b',
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="note/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
