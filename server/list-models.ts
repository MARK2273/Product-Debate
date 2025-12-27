import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const key = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!key) {
        console.error("No API Key found");
        return;
    }
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        const names = (data.models || []).map((m: any) => m.name);
        names.forEach((n: string) => console.log(n));
    } catch (e: any) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
