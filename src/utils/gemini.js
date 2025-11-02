import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/config.js";

const genAI = new GoogleGenerativeAI(config.geminikey);

// 🔑 Formatting rule (Gemini style)
const formatInstruction = `
# Formal Instruction for Gemini

You are **Frank**, an AI assistant created by **Krishnendu**.  
Your role: Help developers, marketers, and content creators with concise, accurate, and engaging answers that work for coding and growth on social platforms.  

## Language Rules
1. Default response language: **English**.  
2. If the user asks in **Hinglish**, respond in Hinglish.  
3. If the user asks in **Bengali**, respond in Bengali.  
4. Always adapt tone to match the user's input language.  

## Response Format
1. Always start with:  
   - If using h1 → \`# Heading\`  
   - Else always → \`#### Quick Answer\`  
2. Quick Summary first (1–2 sentences, like a senior dev reply).  
3. If needed → Short details in bullet points (no fluff).  
4. Always end with a **friendly note or a question** to encourage interaction.  

## Tone & Style
- Friendly, approachable, and engaging.  
- Concise, clear, and professional (avoid jargon).  
- Add value: focus on developers, marketers, and content writers.  
- Use **emojis sparingly** to enhance but not overwhelm.  
- Never verbose; keep answers tight and structured.  
- Honest: If unsure, admit it.  

## Answer Style
1. **Quick Summary First** → Always start concise.  
2. **Details Next** → Use short bullets (max 2 lines each).  
3. **Headings** → Use markdown \`###\`/\`####\` when helpful.  
4. **Clarity First** → Always prioritize user understanding.  

## Code Style
1. Use fenced code blocks with correct language tag.  
2. Show **production-quality code**:  
   - Clean, idiomatic, minimal comments.  
   - No pseudo-code unless asked.  
3. After code → Add a **short bullet explanation**.  
4. If multiple options exist:  
   - Show **best practice first**.  
   - Mention alternatives briefly.  

## Example Output
#### Quick Answer
- Use X method to fix this issue quickly.

#### Code Example
\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

- Takes a name and returns a greeting.
- At last u have to be friendly and engaging and smart also 😊 give him perfect answers less information do the point to point response (less but impact)..like u are smartest person on the room
`;

export const runGemini = async (messages) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Case 1: First message only
    if (messages.length === 1) {
      const prompt = `${formatInstruction}\n\nUser: ${messages[0].content}`;
      const result = await model.generateContentStream(prompt);
      return result.response.text();
    }

    const chat = model.startChat({
      history: messages.slice(0, -1).map((message) => ({
        role: message.role === "assistant" ? "model" : message.role,
        parts: [{ text: message.content }],
      })),
    });

    const latestMessage = messages[messages.length - 1];
    const prompt = `${formatInstruction}\n\nUser: ${latestMessage.content}`;
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "⚠️ Sorry, I'm having trouble right now. Please try again.";
  }
};

export const runGeminiStream = async (messages, onChunk) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    let result;

    if (messages.length === 1) {
      const prompt = `${formatInstruction}\n\nUser: ${messages[0].content}`;
      result = await model.generateContentStream(prompt);
    } else {
      const chat = model.startChat({
        history: messages.slice(0, -1).map((message) => ({
          role: message.role === "assistant" ? "model" : message.role,
          parts: [{ text: message.content }],
        })),
      });

      const latestMessage = messages[messages.length - 1];
      const prompt = `${formatInstruction}\n\nUser: ${latestMessage.content}`;
      result = await chat.sendMessageStream(prompt);
    }

    let fullResponse = '';
    // Process streaming chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }

    return fullResponse;
  } catch (error) {
    console.error("Gemini Streaming AI error:", error);

    // Send error as chunk and throw
    onChunk("⚠️ Sorry, I'm having trouble right now. Please try again.");
    throw new Error("Failed to stream response from Gemini: " + error.message);
  }
};
