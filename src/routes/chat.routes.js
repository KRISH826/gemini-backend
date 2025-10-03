import express from "express";
import { createNewChat, deleteChat, getAllChats, getChatById, sendMessage, sendMessageStream } from "../controllers/chat.controllers.js";

const router = express.Router();

router.get('/allchat', getAllChats);                    // GET /api/chats
router.post('/createnewchat', createNewChat);                 // POST /api/chats
router.get('/getchat/:chatId', getChatById);             // GET /api/chats/:id
router.post('/sendmessage/:chatId/message', sendMessage);    // POST /api/chats/:id/message
router.post("/sendmessage/:chatId/stream", sendMessageStream); // POST /api/chats/:id/message (streaming)
router.delete('/deletechat/:chatId', deleteChat);           // DELETE /api/chats/:id
export default router;