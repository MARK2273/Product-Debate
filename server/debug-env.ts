import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';

// Force load .env from current directory (project root)
const envPath = path.resolve(process.cwd(), '.env');
console.log("Debug: Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Debug: dotenv error:", result.error);
}

const key = process.env.GEMINI_API_KEY;
console.log("Debug: API Key present?", !!key);
if (key) {
    console.log("Debug: Key length:", key.length);
    console.log("Debug: First 4 chars:", key.substring(0, 4));
}

async function testGemini() {
    if (!key) {
        console.error("Debug: No key, skipping test.");
        return;
    }
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log("Debug: Testing generation...");
        const res = await model.generateContent("Say hello");
        console.log("Debug: Success!", await res.response.text());
    } catch (e: any) {
        console.error("Debug: Gemini API Failed:", e.message);
    }
}

testGemini();
