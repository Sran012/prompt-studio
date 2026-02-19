import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChat(messages :ChatMessage[]) {
  return openai.chat.completions.create({
    model: "mistralai/mistral-7b-instruct",
    messages,
    stream: true,
  });
}
