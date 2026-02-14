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
        const completion = await openai.chat.completions.create({ 
            model : "mistralai/mistral-7b-instruct",
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
        });

        const result = completion.choices[0].message.content;
        return NextResponse.json({ optimizedPromptFromAi: result });
    } catch(e) {
        console.error("Error optimizing prompt:", e);
        return NextResponse.json({ error: "Failed to optimize prompt" }, { status: 500 });
    }
    
}