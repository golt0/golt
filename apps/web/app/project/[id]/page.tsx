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
  isAuthError,
} from "@/app/lib/api"
import { useProjectStore } from "@/store/project.store"
import ProjectTabs from "@/app/components/ProjectMenu";

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
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [input, setInput] = useState("");
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    async function init() {

      try {
        await getMe();

        const projects = await getProjects();
        const project = projects.find((p: any) => p.id === id);
        if (!project) { router.push("/dashboard"); return; }
        setCurrentProject(project);
        if (project.previewUrl) setPreviewUrl(project.previewUrl);
      } catch (err) {
        if (isAuthError(err)) router.push("/login");
        setFetching(false);
        return;
      }


      try {
        const msgData = await getMessages(id);
        setMessages(msgData.messages ?? []);
      } catch (err) {
        console.error("Failed to load messages", err);
      }

      try {
        const fileData = await getFiles(id);
        setFiles(fileData.files ?? []);
      } catch (err) {
        console.error("Failed to load files", err);
      }

      try {
        const sandbox = await startSandbox(id);
        if (sandbox?.previewUrl) setPreviewUrl(sandbox.previewUrl);
      } catch (err) {
        console.error("Failed to start sandbox", err);
      }

      setFetching(false);
    }
    init();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");

    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", projectId: id }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const eventName = msg.event;
        const data = msg.data ?? {};

        if (eventName === "agent:thinking") {
          setIsAgentThinking(true);

          addMessage({
            id: `ai=${Date.now()}`,
            role: "assistant",
            content: "",
            projectId: id
          })
        }

        if (eventName === "agent:token") {
          useProjectStore.getState().appendToken(data.text ?? "")
        }

        if (eventName === "file:written") {
          const file = {
            path: data.path,
            content: data.content ?? ""
          }

          useProjectStore.getState().upsertFile(file);

          useProjectStore.getState().setSelectedFile(file);
        }

        if (eventName === "agent:done") {
          setIsAgentThinking(false);
          console.error("Agent error :", data.error)
        }
      } catch (error) {
        console.error("ws parse error", error)
      }
    }

    ws.onerror = (err) => {
      console.error("websocket error", err)
    }

    ws.onclose = () => {
      console.log("Websocket closed")
    }

    return () => {
      ws.close()
    }
  }, [id, addMessage, setIsAgentThinking])




  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    } catch (err) {
      console.error(err);
      setIsAgentThinking(false)
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
    <div className="h-screen bg-[#0d0d0d] text-white flex overflow-hidden">

      {/* chat*/}
      <div className="flex flex-col border-r shrink-0 border-gray-800" style={{ width: `${sidebarWidth}px` }}>


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
              className={`text-sm rounded-lg px-3 py-2 leading-relaxed ${msg.role === "user"
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


        <div className="border border-neutral-700 rounded-2xl p-3 bg-neutral-900">
          <textarea
            rows={3}
            placeholder="Ask Lovable..."
            className="w-full bg-transparent outline-none resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="flex justify-between mt-3">
            <button>+</button>

            <button
              onClick={handleSend}
              className="w-8 h-8 rounded-full bg-white text-black"
            >
              ↑
            </button>
          </div>
        </div>

      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-neutral-800 flex items-center justify-start px-4 bg-[#0d0d0d]">
          <ProjectTabs
           activeTab={activeTab}
           setActiveTab={setActiveTab}
           />

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-4 text-xs text-neutral-500 hover:text-white"
            >
              Open ↗
            </a>
          )}
        </div>

        {activeTab === "preview" ? (
          previewUrl ? (
            <iframe
              src={previewUrl}
              className="flex-1 w-full border-none bg-white"
              title="Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              Starting sandbox...
            </div>
          )
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 border-r border-neutral-800 bg-[#111111] overflow-y-auto">
              <div className="p-3 text-xs uppercase text-neutral-500">
                Files
              </div>

              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`block w-full text-left px-3 py-2 text-sm ${selectedFile?.path === file.path
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-900"
                    }`}
                >
                  {file.path}
                </button>
              ))}
            </div>

            <pre className="flex-1 overflow-auto p-6 text-sm font-mono bg-[#0d0d0d]">
              {selectedFile?.content || "Select a file"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}