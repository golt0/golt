"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getMe,
  getProjects,
  getMessages,
  sendMessages,
  getFiles,
  startSandbox,
} from "@/app/lib/api";
import { useProjectStore } from "@/store/project.store"

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    addMessage,
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    isAgentThinking,
    setIsAgentThinking,
    previewUrl,
    setPreviewUrl,
    currentProject,
    setCurrentProject,
  } = useProjectStore();

  const [input, setInput] = useState("");
  const [fetching, setFetching] = useState(true);

  // ── Auth + load data ──
  useEffect(() => {
    async function init() {
      try {
        await getMe();

        // Project info
        const projects = await getProjects();
        const project = projects.find((p: any) => p.id === id);
        if (!project) { router.push("/dashboard"); return; }
        setCurrentProject(project);
        if (project.previewUrl) setPreviewUrl(project.previewUrl);

        // Messages
        const msgData = await getMessages(id);
        setMessages(msgData.messages ?? []);

        // Files
        const fileData = await getFiles(id);
        setFiles(fileData.files ?? []);

        // Sandbox start karo
        const sandbox = await startSandbox(id);
        if (sandbox?.previewUrl) setPreviewUrl(sandbox.previewUrl);

      } catch {
        router.push("/login");
      } finally {
        setFetching(false);
      }
    }
    init();
  }, [id]);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──
  async function handleSend() {
    const content = input.trim();
    if (!content || isAgentThinking) return;

    addMessage({
      id: Date.now().toString(),
      role: "user",
      content,
      projectId: id,
    });
    setInput("");
    setIsAgentThinking(true);

    try {
      const data = await sendMessages(id, content);

      if (data.message) {
        addMessage({
          id: data.message.id ?? Date.now().toString() + "_ai",
          role: "assistant",
          content: data.message.content,
          projectId: id,
        });
      }

      if (data.files) setFiles(data.files);
      if (data.previewUrl) setPreviewUrl(data.previewUrl);

    } catch (err) {
      console.error(err);
    } finally {
      setIsAgentThinking(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">

      {/* ── 1. Chat ── */}
      <div className="flex flex-col w-80 shrink-0 border-r border-gray-800">

        {/* Header */}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-10">
              Kuch batao — kya banana hai?
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm rounded-lg px-3 py-2 leading-relaxed ${
                msg.role === "user"
                  ? "bg-gray-800 text-white ml-6"
                  : "bg-gray-900 text-gray-300 mr-6 border border-gray-800"
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

        {/* Input */}
        <div className="p-3 border-t border-gray-800 shrink-0">
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Changes batao..."
            className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2 resize-none
                       placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
          <button
            onClick={handleSend}
            disabled={isAgentThinking || !input.trim()}
            className="mt-2 w-full py-1.5 bg-white text-gray-900 text-sm font-medium rounded-lg
                       hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAgentThinking ? "Thinking..." : "Send →"}
          </button>
        </div>
      </div>

      {/* ── 2. File explorer ── */}
      <div className="flex flex-col w-52 shrink-0 border-r border-gray-800">
        <div className="h-12 flex items-center px-4 border-b border-gray-800 text-xs text-gray-400 font-medium uppercase tracking-wide">
          Files
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {files.length === 0 && (
            <p className="text-xs text-gray-600 px-3 mt-4">No files yet</p>
          )}
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-1.5 rounded text-xs truncate transition-colors ${
                selectedFile?.path === file.path
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {file.path}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Code / Preview ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center h-12 border-b border-gray-800 px-4 gap-4 shrink-0">
          <span className="text-xs text-gray-400">
            {selectedFile ? selectedFile.path : "Preview"}
          </span>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-gray-500 hover:text-white underline"
            >
              {previewUrl} ↗
            </a>
          )}
        </div>

        {/* Content */}
        {selectedFile ? (
          <pre className="flex-1 overflow-auto p-4 text-xs text-gray-300 font-mono leading-relaxed bg-gray-900">
            {selectedFile.content}
          </pre>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-none bg-white"
            title="Project Preview"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-600">
            Sandbox start ho raha hai...
          </div>
        )}
      </div>
    </div>
  );
}