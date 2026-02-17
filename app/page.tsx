"use client";
import { useRef, useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

async function submit() {
    if(!prompt.trim()) return;

    const controller = new AbortController(); 
    abortRef.current = controller;

    setLoading(true);
    setPrompt("");
    setError("");

    try {
      const res = await fetch("/api/optimize",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify({prompt}),
        signal: controller.signal,
      });

      if(!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      if(!res.body) {
        throw new Error("No stream");
      }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let accumulated = "";

        while(true) {
          const {value, done} = await reader.read();
          if(done) break;

          const chunk = decoder.decode(value);
          accumulated += chunk;
          setOptimizedPrompt(accumulated);
        }
      
    } catch(e: any) {
      if(e.name === "AbortError") {
        console.log("Request aborted");
      } else {
        setError(e.message || "Failed to optimize prompt");
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  } 

  function handleAbort() {
    abortRef.current?.abort();
    setLoading(false);
  }


  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-900">
      <div className="">
         <input value={prompt} onChange={(e)=> {setPrompt(e.target.value)}} className="h-10 w-40 border-black bg-white text-black px-2"/>
         {loading && (
        <button
          onClick={handleAbort}
          className="ml-3 px-4 py-2 bg-red-500 text-white"
        >
          Cancel
        </button>
      )}
         <button onClick={submit} className="h-10 w-20 bg-blue-500 text-white ml-2">{loading ? "optimize": "optimizing"}</button>
      </div>
       <div className="">
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <h2 className="text-lg font-bold mt-4 text-white">Optimized Prompt:</h2>
        <p className="mt-2 text-white">{optimizedPrompt}</p>
       </div>
    </div>
  );
}
