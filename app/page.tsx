"use client";
import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 group`}>
      <div
        className={`max-w-[85%] px-5 py-4 rounded-2xl ${
          isUser
            ? "bg-transparent text-white"
            : "bg-[#e7e5e4] dark:bg-[#262626] text-gray-900 dark:text-gray-100"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assistant</span>
          </div>
        )}
        <div className={`${isUser ? "ml-auto" : ""} ${isUser ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !className;
                return isInline ? (
                  <code className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-200 dark:bg-gray-700" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="p-4 rounded-xl overflow-x-auto mt-3 text-sm bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              p({ children }) {
                return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
              },
              li({ children }) {
                return <li className="mb-1">{children}</li>;
              },
              h1({ children }) {
                return <h1 className="text-xl font-bold mb-3">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-base font-semibold mb-2">{children}</h3>;
              },
              blockquote({ children }) {
                return <blockquote className="border-l-4 pl-4 italic opacity-80 my-3">{children}</blockquote>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="flex-1 overflow-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center mt-24">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Prompt Studio</h2>
              <p className="text-gray-500 dark:text-gray-400">Enter a prompt below to optimize it with AI</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gray-100 dark:bg-[#262626] rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:ring-0 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              className="w-full bg-transparent text-gray-900 dark:text-white px-5 py-4 pr-24 resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              rows={2}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              {loading ? (
                <button
                  onClick={handleAbort}
                  className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
