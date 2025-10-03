import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 8000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export { messageSchema };
export const Message = mongoose.model("Message", messageSchema);
