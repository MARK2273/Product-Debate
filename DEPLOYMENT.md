# 🚀 Deployment Guide

This project is configured and ready for deployment.

**Backend**: Deployed on **Render** (Free Tier).
**Frontend**: Deployed on **Vercel** (Free Tier).

---

## Part 1: Deploy Backend (Render)

1.  **Push Code to GitHub**: Make sure your latest code is on GitHub.
2.  **Sign up/Login** to [render.com](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub Repository.
5.  **Configure Service**:
    - **Root Directory**: `server` (Important!)
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `node dist/index.js`
6.  **Environment Variables** (Scroll down to "Advanced"):
    - `GEMINI_API_KEY`: Paste your generic Google Gemini API Key.
    - `PORT`: `3005` (or let Render choose, usually 10000).
7.  Click **Create Web Service**.
8.  **Wait**: It will take a few minutes. Once live, copy the **Service URL** (e.g., `https://my-debate-api.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1.  **Sign up/Login** to [vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub Repository.
4.  **Configure Project**:
    - **Root Directory**: Click "Edit" and select `client`.
    - **Framework Preset**: Select `Vite`.
5.  **Environment Variables**:
    - **Name**: `VITE_API_URL`
    - **Value**: Paste your **Render Backend URL** from Part 1, followed by `/api` (e.g., `https://my-debate-api.onrender.com/api`).
6.  Click **Deploy**.

---

## ✅ Done!

Your app is now live.

- The Frontend (Vercel) will talk to the Backend (Render).
- The Backend will talk to Gemini AI.
