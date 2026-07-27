"use client";

import { createProject, deleteProject, sendMessages, getMe, getProjects } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function extractName(message: string): string {
  const cleaned = message
    .toLowerCase()
    .replace(/^(create|build|make|develop|i want|can you|please|me)\s+/gi, "")
    .trim();
  return cleaned.slice(0, 40) || "untitled project";
}

export default function DashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await getMe();
        const data = await getProjects();
        setProjects(data.projects ?? []);
      } catch {
        router.push("/login");
      } finally {
        setFetching(false);
      }
    }
    init();
  }, []);

  async function handleBuild() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const name = extractName(prompt);
      const { project } = await createProject(name);
      await sendMessages(project.id, prompt);
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error(error);
    } finally {
    
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (fetching) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Loading...
    </div>
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-20">

      
      <h1 className="text-3xl font-semibold text-gray-900 mb-8">
        What do you want to build?
      </h1>

      
      <textarea
        rows={4}
        placeholder="create a whatsapp clone..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleBuild();
          }
        }}
        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg resize-none
                   focus:outline-none focus:ring-2 focus:ring-gray-900
                   placeholder:text-gray-400"
      />

      <button
        onClick={handleBuild}
        disabled={loading || !prompt.trim()}
        className="mt-3 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg
                   hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        {loading ? "Building..." : "Build →"}
      </button>

     
      {projects.length > 0 && (
        <div className="mt-16">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Recent Projects
          </h2>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span
                  onClick={() => router.push(`/project/${p.id}`)}
                  className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 hover:underline"
                >
                  {p.name}
                </span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}