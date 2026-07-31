"use client";

import MyProjects from "@/app/components/MyProjects";
import {
  createProject,
  deleteProject,
  sendMessages,
  getMe,
  getProjects,
  isAuthError,
} from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const me = await getMe();
        setUser(me);

        const data = await getProjects();
        setProjects(data ?? []);
      } catch (err) {
        if (isAuthError(err)) router.push("/login");
      } finally {
        setFetching(false);
      }
    }

    init();
  }, [router]);

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

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <main className="relative min-h-screen rounded-3xl border border-zinc-800 w-full overflow-hidden bg-black">
      
       <div
         aria-hidden
        className="pointer-events-none mb-350 absolute inset-0"
       style={{
         background:
          "radial-gradient(ellipse 140% 85% at 50% 115%, #ff3d8a 0%, #ff3d8a 14%, #ec4899 24%, #a855f7 38%, #4f6bff 52%, #1a2560 68%, #05060f 82%, rgba(0,0,0,0) 100%)",

          WebkitMaskImage:
        "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
        maskImage:
        "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
        }}
      />

      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 130%, rgba(255,80,170,0.55), transparent 70%)",
        }}
      />

      <section className="relative z-10 flex min-h-screen flex-col items-center px-6 pt-56">
       
        <h1 className="mb-10 text-center text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Got an idea
          {user?.name ? `, ${user.name}` : ", Buddy"}?
        </h1>

      
        <div className="w-full max-w-3xl">
          <div className="rounded-3xl bg-neutral-900/85 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur">
            <textarea
              rows={2}
              placeholder="Ask to build a prototype..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleBuild();
                }
              }}
              className="w-full resize-none bg-transparent px-2 text-lg leading-relaxed text-white placeholder:text-neutral-500 focus:outline-none"
            />

            <div className="mt-3 flex items-center justify-end px-1">
              <button
                onClick={handleBuild}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Building..." : "Build →"}
              </button>
            </div>
          </div>
        </div>

      
        <div className="mt-64 w-full min-w-0">
          <MyProjects />
        </div>
      </section>
    </main>
  );
}