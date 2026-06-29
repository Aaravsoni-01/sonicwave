# 🌊 Sonicwave — Feel the Music

Sonicwave is a premium, fully-featured **Spotify clone** built with Next.js App Router, custom vanilla CSS design tokens, and a localized database engine. It integrates **Web Audio API** processing for interactive canvas visualizers alongside a full suite of extra tools like synced lyrics, mood mixes, social feeds, and karaoke modes.

---

## 🚀 Tech Stack

Sonicwave uses a modern, lightweight, dependency-free frontend architecture:

*   **Core Framework**: [Next.js](https://nextjs.org/) (App Router, Client/Server routing, React 19)
*   **Styling**: Vanilla CSS (Custom design tokens, responsive breakpoints, keyframe micro-animations, glassmorphism)
*   **Audio Pipeline**: HTML5 `<audio>` elements wrapped inside a custom **Web Audio API** graph (`AudioContext` -> `MediaElementAudioSourceNode` -> `AnalyserNode` -> `GainNode`) for real-time FFT frequency mapping
*   **State Management**: React Context (`PlayerContext.js`) with custom `useReducer` hooks
*   **Data Persistence**: Client-side `localStorage` wrapper database (`dataStore.js`) for tracking likes, listening logs, streaks, and playlist folders
*   **Media Assets**: High-resolution custom AI artwork and silent loop audio tracks pre-scaffolding

---

## ✨ Features

### 🎵 1. Core Audio Engine & Player
*   **Standard Controls**: Seamless Play, Pause, Next, Previous track, and Seek sliders.
*   **Repeat & Shuffle**: Standard repeat-modes (`off`, `all`, `one`) and Fisher-Yates array shuffling.
*   **Volume Controller**: Pop-over hover bar supporting mute/unmute toggles.
*   **Sleep Timer**: Selectable countdown timers (5 to 60 minutes) that trigger auto-pauses.

### 📊 2. AI Recommendations & Discovery
*   **Home Dashboard**: Greeting banners determined by the user's local time, horizontal carousels for new releases, and curated playlists.
*   **Time-Based Suggestions**: Suggests specific vibes (Morning Focus, Night Chill) according to your current hour.
*   **Personalized Feeds**: An algorithm scores catalog items using genre similarity, mood overlap, and plays.

### 🎤 3. Synced Lyrics & Karaoke Mode
*   **Synchronized Lyrics**: Smooth scrolling panel highlighting current lines with glows and dimming past lyrics.
*   **Karaoke Stage**: Large-font lyric prompts, bouncing rhythm dots, toggled microphone input simulations, and dynamic score awards.

### 🎨 4. Audio Visualizers
*   Canvas-based visualizers processing real-time FFT frequency bars. Supports 4 interactive modes:
    *   **Equalizer**: Pulsing frequency columns with glow shadows.
    *   **Circular**: Dial rings mapping audio frequencies outward.
    *   **Waves**: Triple layered sine-curves.
    *   **Particles**: Floating particle physics triggered by bass beats.

### 📻 5. Extra Panels & Tools
*   **Mood Mixer**: Energy-mix selectors (😊 Happy, ⚡ Energetic, 😌 Calm) that instantly build matching playlists.
*   **Podcasts section**: Accordeon-style episodes, categories, speed rate adjustors (0.5x to 2x), and skip forward/rewind controls.
*   **Stats Dashboard**: Spotify Wrapped style overview charting listening streaks, minutes count, and CSS genre bars.
*   **Social Activity**: Status indicators showing friends' listening activity and copyable share links.
*   **Library**: Manage liked tracks or create custom playlists.

---

## 🛠️ Getting Started

To run the application locally on your machine, follow these instructions:

### 1. Set Workspace
Open the root directory in your preferred IDE:
```bash
C:\Users\hp\.gemini\antigravity\scratch\sonicwave
```

### 2. Install Dependencies
Run the standard package installation command:
```bash
npm install
```

### 3. Run Development Server
Launch the development server:
```bash
npm run dev
```

### 4. Enjoy!
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Project Structure

```text
sonicwave/
├── app/                  # App Router views & layouts
│   ├── album/            # Album details
│   ├── artist/           # Artist details
│   ├── karaoke/          # Karaoke stage
│   ├── library/          # Library tab panels
│   ├── lyrics/           # Synced lyrics page
│   ├── mood/             # Mood mix generator
│   ├── playlist/         # Playlist track grids
│   ├── podcasts/         # Podcasts hub
│   ├── social/           # Friends feed & sharing
│   ├── stats/            # Listening stats
│   ├── globals.css       # Style guides & custom tokens
│   └── layout.js         # Page scaffolding
├── components/           # Shell UI widgets
│   ├── Header/           # Navigation & Search bars
│   ├── Player/           # Music controller bar
│   ├── Sidebar/          # Main navigation links
│   └── Visualizer/       # Audio canvas visualizers
├── contexts/             # Global React state reducer
├── data/                 # Mock database modules (Tracks, Artists, Lyrics)
├── lib/                  # Web Audio processing & localStorage database APIs
└── public/               # Static MP3 dummy audio and PNG artwork files
```

---

## 📜 License
Created for pair-programming demonstration purposes. Enjoy listening to Sonicwave!
