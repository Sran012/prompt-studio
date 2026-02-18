import { NextRequest } from "next/server";
import { streamOptimizedPrompt } from "../../../lib/ai";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  console.log("Received prompt for optimization:", prompt);

  const stream = await streamOptimizedPrompt(prompt);

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
