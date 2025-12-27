# ⚡ AI Product Debate Arena

> **Watch AI Agents Battle for Supremacy.**  
> A real-time, voice-enabled debate platform where AI personas represent products and argue their case in a moderated showdown.

![Debate Arena UI](https://via.placeholder.com/800x400.png?text=AI+Debate+Arena+Preview)

---

## 🚀 Features

### 🎙️ Immersive Audio Experience

- **Unique Voice Identities**: Each product is assigned a distinct voice that sticks with them throughout the debate.
- **Smart Pitch Modulation**: Even with limited browser voices, agents sound unique thanks to intelligent pitch shifting.
- **Real-time TTS**: Listen to the debate unfold live with a professional moderator voice.

### 🎨 Premium "Dark Mode" UI

- **Glassmorphism Design**: Sleek, modern interface with translucent cards and neon accents.
- **Unified Feed**: A clean, centralized chat stream that scales effortlessly to multiple products.
- **Focus Mode**: The active speaker glows subtly, ensuring you never lose track of the action.

### 🧠 Intelligent Debate Engine

- **Powered by Gemini Pro**: Leveraging Google's advanced LLM for deep, strategic arguments.
- **Structured Rounds**:
  1.  **Opening Statements**: High-energy intros.
  2.  **Pros & Cons**: Strategic analysis.
  3.  **Cross-Examination**: Ruthless attacks on competitors.
  4.  **Rebuttals**: Defensive counters.
  5.  **Final Verdict**: The Moderator decides the winner.

### 🛡️ Robust Architecture

- **Error Resilience**: Graceful handling of API limits or network failures with "Dismiss & Retry" options.
- **Scalable**: Built on a decoupled Client-Server architecture ready for deployment.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Vanilla CSS (Variables, Animations).
- **Backend**: Node.js, Express, TypeScript.
- **AI Core**: Google Gemini API (`gemini-pro`).
- **Audio**: Web Speech API (SpeechSynthesis).

---

## 🏁 Quick Start

### Prerequisites

- Node.js (v18+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Backend Setup

The server handles the AI logic to keep your API key secure.

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
GEMINI_API_KEY=your_key_here
PORT=3005
```

Start the API:

```bash
npm run dev
```

### 2. Frontend Setup

The client provides the interactive arena.

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to enter the arena!

---

## 🚢 Deployment

This app is production-ready.

- **Frontend**: Deploy to **Vercel** or Netlify.
- **Backend**: Deploy to **Render** or Railway.

👉 **[Read the Full Deployment Guide](./deployment.md)** for step-by-step instructions.

---

## 📸 Usage Guide

1.  **Add Contenders**: Enter products like "iPhone 15" vs "Samsung S24".
2.  **Add Details (Optional)**: Paste a URL or brief specs to give the AI more context.
3.  **Start Showdown**: Click the button and watch the magic.
4.  **Audio Control**: Toggle the "Muted/Live" button to hear the voices.

---

Made with ❤️ and 🤖 using Gemini.
