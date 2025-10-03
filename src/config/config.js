import {config as conf} from "dotenv";
conf();

const _config = {
    port: process.env.BACKEND_PORT,
    mongoUrl: process.env.MONGO_URL,
    frontendPort: process.env.FRONTEND_PORT,
    geminikey: process.env.GEMINI_API_KEY,
    redisUrl: process.env.REDIS_URL,
}

export const config = Object.freeze(_config);