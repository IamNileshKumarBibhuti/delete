"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

const assistantGreeting = {
  role: "assistant",
  content: "Hi! I'm DeepGuard Assist. Ask me about deepfakes, safety tips, or how to upload your media.",
};

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<typeof assistantGreeting[]>([assistantGreeting]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:4000/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-80 sm:w-96 glass-card rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="font-semibold">DeepGuard Assist</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">Professional, friendly guidance</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div ref={scrollRef} className="h-80 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hidden">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "assistant"
                      ? "bg-indigo-500/10 text-slate-800 dark:text-slate-100"
                      : "bg-indigo-600 text-white ml-auto"
                  )}
                >
                  {message.content}
                </div>
              ))}
              {isTyping && (
                <div className="max-w-[70%] rounded-2xl px-4 py-3 text-sm bg-indigo-500/10 text-slate-700 dark:text-slate-200">
                  <span className="inline-flex gap-1 items-center">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-4 border-t border-white/10">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about deepfakes..."
                className="flex-1 rounded-full bg-white/70 dark:bg-black/30 px-4 py-2 text-sm focus:outline-none"
                aria-label="Chat message"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-glow flex items-center justify-center hover:scale-105 transition"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
