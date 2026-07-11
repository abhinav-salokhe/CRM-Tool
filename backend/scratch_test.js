import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function test() {
  console.log("GEMINI_API_KEY starts with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 10) : "undefined");
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, say test",
    });
    console.log("Success! Response:", response.text);
  } catch (error) {
    console.error("Error during call:", error);
  }
}

test();
