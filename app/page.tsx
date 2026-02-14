"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");

  const submit = () => {
    const result = fetch("/api/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({prompt})
    })
    .then(res => res.json())
    .then(data => {
      setOptimizedPrompt(data.optimizedPromptFromAi?.result ?? data.optimizedPromptFromAi ?? "");
    })
  } 
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-900">
      <div className="">
         <input value={prompt} onChange={(e)=> {setPrompt(e.target.value)}} className="h-10 w-40 border-black bg-white text-black px-2"/>
         <button onClick={submit} className="h-10 w-20 bg-blue-500 text-white ml-2">Optimize</button>
      </div>
       <div className="">
        <h2 className="text-lg font-bold mt-4 text-white">Optimized Prompt:</h2>
        <p className="mt-2 text-white">{optimizedPrompt}</p>
       </div>
    </div>
  );
}
