import { deleteCache, getJson, setJson } from "../cache/query.js";
import { Chat } from "../schemas/chat.schema.js";
import { runGemini, runGeminiStream } from "../utils/gemini.js";
import { errorResponse, successResponse } from "../utils/response.js";

/** ------------------- Get all chats ------------------- **/
export const getAllChats = async (req, res) => {
    const CACHE_KEY = "chats";  // Chat list cache
    const CACHE_TTL = 100;

    try {
        const cachedChats = await getJson(CACHE_KEY);
        if (cachedChats) {
            console.log("✅ Redis cache hit for chat list");
            return successResponse(res, "Chats retrieved from cache", { chats: cachedChats });
        }

        const chats = await Chat.find()
            .select("title lastActivity messages")
            .sort({ lastActivity: -1 });

        const chatList = chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            messageCount: chat.messages.length,
            lastmessage:
                chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].content.substring(0, 60) + "..."
                    : "Start new conversation",
        }));

        await setJson(CACHE_KEY, chatList, 100);

        return successResponse(res, "Chats retrieved successfully", {
            chats: chatList,
            fromCache: false
        });
    } catch (error) {
        console.error("getAllChats error:", error);
        errorResponse(res, "Internal Server Error", 500);
    }
};

/** ------------------- Create new chat ------------------- **/
export const createNewChat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return errorResponse(res, "First message is required to create chat", 400);
        }

        const title = message.trim().length > 34
            ? message.trim().substring(0, 34) + "..."
            : message.trim();

        const chat = new Chat({
            title,
            messages: []
        });

        await chat.save();

        // Invalidate chat list cache
        await deleteCache("chats");

        const chatData = {
            _id: chat._id,
            title: chat.title,
            messages: []
        };

        return successResponse(res, "Chat created successfully", { chat: chatData });
    } catch (error) {
        console.error("createNewChat error:", error);
        return errorResponse(res, "Internal Server Error", 500);
    }
};

export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const CACHE_KEY = `messages:single:${chatId}`;
        const CACHE_TTL = 100;

        const cachedChat = await getJson(CACHE_KEY);
        if (cachedChat) {
            console.log(`📦 Redis cache hit for chat ${chatId}`);
            return successResponse(res, "Chat retrieved from cache", { chat: cachedChat });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return errorResponse(res, "Chat not found", 404);
        }

        await setJson(CACHE_KEY, chat.toObject(), CACHE_TTL);

        return successResponse(res, "Chat retrieved successfully", { chat });
    } catch (error) {
        console.error("getChatById error:", error);
        errorResponse(res, "Internal Server Error", 500);
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) {
            return errorResponse(res, "Chat not found", 404);
        }

        await Promise.all([
            deleteCache(`messages:single:${chatId}`), // single chat cache
            deleteCache("chats")                      // chat list cache
        ]);

        return successResponse(res, "Chat deleted successfully", { chat });
    } catch (error) {
        console.error("deleteChat error:", error);
        errorResponse(res, "Internal Server Error", 500);
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return errorResponse(res, "Message is required", 400);
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return errorResponse(res, "Chat not found", 404);
        }

        // Add user message
        chat.messages.push({
            role: "user",
            content: message.trim(),
            timestamp: new Date()
        });

        // AI response
        const aiResponse = await runGemini(chat.messages);

        chat.messages.push({
            role: "assistant",
            content: aiResponse,
            timestamp: new Date()
        });

        chat.lastActivity = new Date();
        await chat.save();

        // Invalidate caches
        await Promise.all([
            deleteCache(`messages:single:${chatId}`),
            deleteCache("chats")
        ]);

        // Update single chat cache
        await setJson(`messages:single:${chatId}`, chat, 1000);

        const responseData = {
            userMessage: chat.messages[chat.messages.length - 2],
            aiResponse: chat.messages[chat.messages.length - 1],
            chatId: chat._id,
            title: chat.title
        };

        return successResponse(res, "Message sent successfully", { message: responseData });
    } catch (error) {
        console.error("sendMessage error:", error);
        return errorResponse(res, "Internal Server Error", 500);
    }
};

export const sendMessageStream = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return errorResponse(res, "Message is required", 400);
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return errorResponse(res, "Chat not found", 404);
        }

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
        });

        chat.messages.push({
            role: "user",
            content: message.trim(),
            timestamp: new Date()
        });

        let fullAiResponse = '';

        try {
            await runGeminiStream(chat.messages, (chunk) => {
                fullAiResponse += chunk;
                res.write(`data: ${JSON.stringify({ content: chunk, chatId })}\n\n`);
            });

            chat.messages.push({
                role: "assistant",
                content: fullAiResponse,
                timestamp: new Date()
            });

            chat.lastActivity = new Date();
            await chat.save();

            // Invalidate caches
            await Promise.all([
                deleteCache(`messages:single:${chatId}`),
                deleteCache("chats")
            ]);

            // Send completion signal
            res.write(`data: ${JSON.stringify({
                done: true,
                fullMessage: fullAiResponse,
                chatId,
                title: chat.title
            })}\n\n`);

            res.end();
        } catch (streamError) {
            console.error("Streaming error:", streamError);
            res.write(`data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error("sendMessageStream error:", error);
        try {
            res.write(`data: ${JSON.stringify({ error: "Internal server error", done: true })}\n\n`);
            res.end();
        } catch (responseError) {
            console.error("Failed to send SSE error:", responseError);
        }
    }
};
