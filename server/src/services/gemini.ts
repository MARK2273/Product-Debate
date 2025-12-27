import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyA9ESoqFB1dZfuNky_EeqYhq8Vt-2uO770"; // User must provide this
// const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDlG05b4CpbHWni1O0i2Uyug-SKKDafqbc'; // User must provide this
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model: any;

  constructor() {
    if (!API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is missing in process.env");
    } else {
      console.log(
        "Gemini Service initialized with Key length:",
        API_KEY.length
      );
    }
    // Using a standard, widely available model
    // Change this line in your GeminiService constructor
// in your GeminiService constructor
this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });  }

async generateText(prompt: string, systemInstruction?: string, retryCount = 0): Promise<string> {
  try {
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser Input: ${prompt}` : prompt;
    const result = await this.model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    // Check if it's a Rate Limit error (429)
    if (error.status === 429 && retryCount < 3) {
      console.log(`Rate limit hit. Retrying in 10 seconds... (Attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 10500)); // Wait 10.5 seconds
      return this.generateText(prompt, systemInstruction, retryCount + 1);
    }
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate content from Gemini');
  }
}

  async generateJSON(prompt: string, schemaDescription: string): Promise<any> {
    // Force JSON structure via prompting techniques
    const system = `You are a data extraction engine. Output ONLY valid JSON matching this schema: ${schemaDescription}. Do not use markdown blocks.`;
    const text = await this.generateText(prompt, system);
    try {
      // Clean markdown code blocks if present
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error", text);
      return null;
    }
  }
}

export const gemini = new GeminiService();
