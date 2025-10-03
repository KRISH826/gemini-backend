import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import { connectDb } from "./src/db/db.js";
import helmet from "helmet";
import { config } from "./src/config/config.js";
import chatRouter from "./src/routes/chat.routes.js";

const app = express();

app.use(cors({
  origin: config.frontenPort || "http://localhost:5173",
}));
app.use(express.json({ limit: "600kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());


// health
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use("/api/v1/gemini",chatRouter);

export default app;
