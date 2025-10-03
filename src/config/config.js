import {config as conf} from "dotenv";
conf();

const _config = {
    port: process.env.BACKEND_PORT,
    mongoUrl: process.env.MONGO_URL,
    frontenPort: process.env.FRONTEND_PORT,
    geminikey: process.env.GEMINI_API_KEY,
}

export const config = Object.freeze(_config);