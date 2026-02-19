import { NextRequest } from "next/server";
import { streamChat } from "../../../lib/ai";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  console.log("Received messages:", messages);

  const baseSystem = {
    role: "system",
    content:
      "You are a helpful assistant that optimizes user prompts for better results. When given a user prompt, you will rewrite it to be clearer and more effective for AI processing. Always return only the optimized prompt without any explanations or additional text.",
  };

  const stream = await streamChat([baseSystem, ...messages]);

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
