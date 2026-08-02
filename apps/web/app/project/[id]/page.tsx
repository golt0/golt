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
} from "@/app/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  Globe,
  MoreHorizontal,
  Folder,
  Code2,
  ExternalLink,
} from "lucide-react";

const menuItems = [
  { label: "Open", icon: ExternalLink },
  { label: "Files", icon: Folder },
  { label: "Code", icon: Code2 },
];

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
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [input, setInput] = useState("");
  const [fetching, setFetching] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);



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
        <div className="h-14 border-b border-neutral-800 flex items-center justify-center bg-[#0d0d0d]">
          <div className="relative flex items-center rounded-full border border-blue-500/40 bg-blue-600/10 p-1 backdrop-blur-md">


            <motion.div
              layoutId="tab"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`absolute top-1 bottom-1 rounded-full bg-blue-500 ${activeTab === "preview"
                  ? "left-1 w-[115px]"
                  : "left-[118px] w-[90px]"
                }`}
            />


            <button
              onClick={() => setActiveTab("preview")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${activeTab === "preview"
                  ? "text-white"
                  : "text-blue-400 hover:text-white"
                }`}
            >
              <Globe size={16} />
              Preview
            </button>


            <button
              onClick={() => setActiveTab("code")}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors ${activeTab === "code"
                  ? "text-white"
                  : "text-blue-400 hover:text-white"
                }`}
            >
              Code
            </button>


            <div className="mx-2 h-5 w-px bg-blue-500/30" />


            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-full p-2 text-blue-400 transition hover:bg-blue-500/20 hover:text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 8, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
                  >
                    {menuItems.map(({ label, icon: Icon }, i) => (
                      <motion.button
                        key={label}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-neutral-300 transition hover:bg-blue-500/10 hover:text-white"
                      >
                        <Icon size={16} className="text-blue-400" />
                        {label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

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