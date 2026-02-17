import  { NextResponse,NextRequest } from 'next/server'
import OpenAI from 'openai';


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});


export async function POST(request: NextRequest) {
    const {prompt} = await request.json();
    console.log("Received prompt for optimization:", prompt);
    
    try {
        const stream = await openai.chat.completions.create({ 
            model : "meta-llama/llama-3.1-8b-instruct",
            messages : [
                {
                    role: "user",
                    content: prompt
                },
                {
                    role: "system",
                    content: "You are a helpful assistant that optimizes the given prompt for better results."
                }
            ],
            temperature: 0.7,
            stream: true,
        });

        const encoder = new TextEncoder();

        return new Response(
            new ReadableStream({
                async start(controller) {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0].delta?.content || "";
                        controller.enqueue(encoder.encode(content));
                    }
                    controller.close();
                }
            }),
            {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                },
            }
        );
        
    } catch(e) {
        console.error("OpenRouter API error:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
    
}