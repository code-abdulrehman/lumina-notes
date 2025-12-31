# Lumina Notes 📝

Lumina Notes is a premium, AI-powered note-taking application built with **React Native**, **Expo**, and **Google Gemini**. It features a modern, aesthetic design with advanced customization and intelligent content generation.

## ✨ Features

- **AI Intelligence**: Summarize, rewrite, and explain your notes using Google Gemini.
- **Dynamic Backgrounds**: Customize notes with curated solid colors, linear gradients, and elegant patterns (Dots, Lines, Grid, etc.).
- **Markdown Support**: Take notes with full markdown rendering for better structure.
- **Smart Reminders**: Set time-based reminders and track completion status.
- **Media Support**: Attach images and videos to your notes.
- **Adaptive Theming**: Automatically follows your system light/dark mode with Zinc-based aesthetics.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (iOS/Android).

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lumina-notes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up AI (Optional):
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Alternatively, you can provide your API key directly within the app's settings.*

## 📱 Local Development

To watch and test the app on your mobile device:

1. Start the development server:
   ```bash
   npm start
   ```

2. **Mobile View**:
   - Install the **Expo Go** app from the App Store or Google Play.
   - For **Android**: Scan the QR code displayed in your terminal.
   - For **iOS**: Open your camera app and scan the QR code.
   - For **Simulators**: Press `i` for iOS simulator or `a` for Android emulator in the terminal.

*Ensure your computer and mobile device are on the same Wi-Fi network.*

## 🏗️ Deployment

Lumina Notes uses **Expo Application Services (EAS)** for building and distribution.

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Build for Android (APK):
   ```bash
   eas build --platform android --profile preview
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios --profile preview
   ```

## 🛠 Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Icons**: Lucide React Native
- **Storage**: AsyncStorage
- **AI**: Google Generative AI (Gemini Flash)
