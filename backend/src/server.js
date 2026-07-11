import dotenv from "dotenv";
dotenv.config({ override: true });
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

// Startup diagnostic — confirm GEMINI_API_KEY is loaded from .env
const keyStatus = process.env.GEMINI_API_KEY
    ? `✅ GEMINI_API_KEY loaded (starts with: ${process.env.GEMINI_API_KEY.slice(0, 8)}...)`
    : "❌ GEMINI_API_KEY is MISSING — check your .env file!";
console.log(keyStatus);

app.listen(env.PORT, () => {
    console.log(`TaskFlow API listening on port ${env.PORT}`);
});