"use client";
import { useProjectStore } from "@/store/project.store";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import { getMessages, sendMessages } from "../lib/api";


export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    setMessages,
    addMessage,
    isAgentThinking,
    setIsAgentThinking,
    currentProject,
  } = useProjectStore();

  const [input, setInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || isAgentThinking) return;

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content,
      projectId: id,
    });
    setInput("");
    setIsAgentThinking(true);

    try {
      await sendMessages(id, content)
    } catch (error) {
      console.log("Falied to send message", error)
      setIsAgentThinking(false);
    }
  }


  return (
    <div className="flex flex-col border-r shrink-0 border-gray-800 w-[360px]">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-gray-800 shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <span className="text-sm font-medium truncate">
          {currentProject?.name ?? "Project"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-10">
            Kuch batao — kya banana hai?
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm px-3 py-2 leading-relaxed ${msg.role === "user"
                ? "bg-[#272725] text-[#A5A5A4] ml-6 rounded-full border border-[#41413E] rounded-br-none"
                : "bg-[#272725] text-[#A5A5A4] mr-6  rounded-2xl border border-[#41413E] rounded-bl-none"
              }`}
          >
            {msg.content}
          </div>
        ))}

        {isAgentThinking && (
          <div className="text-xs text-gray-500 animate-pulse mr-6 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border border-neutral-700 rounded-2xl p-3 bg-neutral-900">
        <textarea
          rows={3}
          placeholder="Ask Lovable..."
          className="w-full bg-transparent outline-none resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex justify-between mt-3">
          <button>+</button>
          <button
            onClick={handleSend}
            disabled={isAgentThinking}
            className="w-8 h-8 rounded-full bg-white text-black disabled:opacity-40"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}