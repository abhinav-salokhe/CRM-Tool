import { getAI } from "../config/gemini.js";
import SYSTEM_PROMPT from "./gemini.prompt.service.js";

class GeminiService {
    async extractCRM(batch) {
        try {
            const prompt = `
                ${SYSTEM_PROMPT}

                Input Rows to extract:
                ${JSON.stringify(batch)}
            `;

            // getAI() is called here — INSIDE the method — so it runs after dotenv
            // has fully loaded process.env. This avoids the ES module init-order bug.
            const ai = getAI();

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    // Enforces that Gemini returns structured, parseable JSON arrays directly
                    responseMimeType: "application/json"
                }
            });

            return JSON.parse(response.text);
        } catch (error) {
            console.error("Gemini Extraction Error:", error.message || error);
            throw error;
        }
    }
}

export default new GeminiService();