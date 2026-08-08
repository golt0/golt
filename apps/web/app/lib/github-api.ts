import { apiFetch } from "./api";

export interface GithubStatus {
  connected: boolean;
  username: string | null;
}

export interface PushResult {
  repoUrl: string;
  failure: { path: string; error: string }[];
}

export interface PushPayload {
  projectId: string;
  repoName: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function redirectToGithubConnect(): void {
  const token = localStorage.getItem("token");
  window.location.href = `${BASE_URL}/github/connect?token=${token}`;
}

export async function fetchGithubStatus(): Promise<GithubStatus> {
  return apiFetch("/github/status");
}

export async function disconnectGithub(): Promise<void> {
  return apiFetch("/github", { method: "DELETE" });
}

export async function pushProjectToGithub(payload: PushPayload): Promise<PushResult> {
  return apiFetch("/github/push", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}