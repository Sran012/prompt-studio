"use client";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  async function submit() {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setInput("");
    setError("");
    setMessages(newMessages);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulated += chunk;
        setMessages([...newMessages, { role: "assistant", content: accumulated }]);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        console.log("Request aborted");
      } else {
        const errorMessage = e instanceof Error ? e.message : "Failed to get response";
        setError(errorMessage);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-gray-900">
      <div className="flex justify-center items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-60 border-black bg-white text-black p-2"
        />
        {loading && (
          <button onClick={handleAbort} className="ml-3 px-4 py-2 bg-red-500 text-white">
            Cancel
          </button>
        )}
        <button onClick={submit} className="h-10 w-20 bg-blue-500 text-white ml-2">
          {loading ? "sending" : "send"}
        </button>
      </div>
      <div className="">
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <div className="mx-auto bg-gray-800 p-4 rounded mt-2 text-white max-h-[600px] overflow-auto w-[500px]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <div className={`inline-block max-w-[80%] p-2 rounded ${msg.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
