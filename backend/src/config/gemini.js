import { GoogleGenAI } from "@google/genai";

/**
 * Returns a fresh GoogleGenAI client every call.
 * This is intentional — we must NOT create the client at module-load time
 * because ES module imports are resolved before dotenv can populate process.env.
 * Reading process.env.GEMINI_API_KEY lazily (at call time) guarantees
 * the value is always available.
 */
export function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is not set. Check your .env file and ensure dotenv is loaded."
        );
    }
    return new GoogleGenAI({ apiKey });
}

export default getAI;