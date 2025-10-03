import mongoose from "mongoose";
import { messageSchema } from "./message.schema.js";

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  messages: [messageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Chat = mongoose.model("Chat", chatSchema);
