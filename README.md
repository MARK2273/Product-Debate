# AI Product Debate & Comparison App

A production-ready web application that orchestrates a multi-round debate between AI agents representing different products.

## Features

- **Dynamic Agents**: Each product gets a dedicated AI representative (based on Gemini).
- **Neutral Moderator**: A separate AI summarizes and picks a winner.
- **Round-Based Debate**: Opening -> Pros/Cons -> Criticism -> Rebuttals -> Conclusion.
- **Modern UI**: Clean, Dark-mode, Chat-style interface using React & Vanilla CSS.

## Prerequisites

- Node.js (v18+)
- Google Gemini API Key

## Setup & Run

### 1. Backend

Navigate to `/server`:

```bash
cd server
npm install
```

Create a `.env` file in `/server` and add your key:

```
GEMINI_API_KEY=your_key_here
PORT=3000
```

Start the server:

```bash
npm run dev
```

### 2. Frontend

Navigate to `/client`:

```bash
cd client
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

## Usage

1. Enter the names of two or more products (e.g., "Sony WH-1000XM5", "Bose QC45").
2. (Optional) Add a URL for more context context.
3. Click **Start Debate**.
4. Watch the agents argue in real-time!
