import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function streamOptimizedPrompt(prompt: string) {
  return openai.chat.completions.create({
    model: "mistralai/mistral-7b-instruct",
    messages: [
      {
        role: "system",
        content:
          "You are a professional prompt engineer. Rewrite the user's prompt to be clear, structured, and precise. Return only the improved prompt.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
  });
}
