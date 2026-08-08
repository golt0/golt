"use client";

import { useEffect, useState } from "react";
import { useGithubStore } from "@/store/project.store";


function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
        ${connected
          ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
          : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-400/20"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-500" : "bg-zinc-400"}`}
      />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

interface PushModalProps {
  projectId: string;
  onClose: () => void;
}

function PushModal({ projectId, onClose }: PushModalProps) {
  const { pushing, pushError, lastPushResult, push, resetPush } =
    useGithubStore();
  const [repoName, setRepoName] = useState("");

  function handleClose() {
    resetPush();
    onClose();
  }

  async function handlePush() {
    if (!repoName.trim()) return;
    const result = await push(projectId, repoName.trim());
    if (result && result.failure.length === 0) {
      setTimeout(handleClose, 2000);
    }
  }

  const isDone = !!lastPushResult;
  const hasFailures = isDone && lastPushResult!.failure.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        {/* hearder */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Push to GitHub
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Creates a private repo if it doesn't exist, updates files if it does.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* input */}
        {!isDone && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Repository name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePush()}
              placeholder="my-project"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900
                placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2
                focus:ring-zinc-500/20"
              disabled={pushing}
            />
          </div>
        )}

        {/* psuh error */}
        {pushError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pushError}
          </div>
        )}

        {/* successand partial failure result */}
        {isDone && (
          <div className="mb-4 space-y-3">
            <a
              href={lastPushResult!.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm
                font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 transition-colors"
            >
              <GithubIcon className="h-4 w-4 shrink-0" />
              {lastPushResult!.repoUrl.replace("https://github.com/", "")}
              <svg className="ml-auto h-3.5 w-3.5 text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13L13 3M6 3h7v7" />
              </svg>
            </a>

            {hasFailures ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="mb-1.5 text-sm font-medium text-amber-800">
                  {lastPushResult!.failure.length} file{lastPushResult!.failure.length > 1 ? "s" : ""} failed to sync
                </p>
                <ul className="space-y-1">
                  {lastPushResult!.failure.map((f) => (
                    <li key={f.path} className="text-xs text-amber-700">
                      <span className="font-mono">{f.path}</span>
                      {" — "}
                      {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
                </svg>
                All files synced successfully
              </div>
            )}
          </div>
        )}

        {/* actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            {isDone ? "Close" : "Cancel"}
          </button>
          {!isDone && (
            <button
              onClick={handlePush}
              disabled={!repoName.trim() || pushing}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white
                hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              {pushing ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  Pushing…
                </>
              ) : (
                <>
                  <GithubIcon className="h-3.5 w-3.5" />
                  Push
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


interface GithubConnectorProps {
  projectId?: string;
}

export function GithubConnector({ projectId }: GithubConnectorProps) {
  const {
    connected,
    username,
    statusLoading,
    statusError,
    loadStatus,
    connect,
    disconnect,
  } = useGithubStore();

  const [showPushModal, setShowPushModal] = useState(false);

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      const url = new URL(window.location.href);
      url.searchParams.delete("github");
      window.history.replaceState({}, "", url.toString());
    }
  }, [loadStatus]);

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        {/* cardheader */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
              <GithubIcon className="h-5 w-5 text-zinc-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">GitHub</p>
                {!statusLoading && <StatusBadge connected={connected} />}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {connected
                  ? `Signed in as @${username}`
                  : "Connect to push projects to repositories"}
              </p>
            </div>
          </div>

          {/* actionbuttons */}
          <div className="flex shrink-0 items-center gap-2">
            {statusLoading ? (
              <Spinner className="h-4 w-4 text-zinc-400" />
            ) : connected ? (
              <>
                {projectId && (
                  <button
                    onClick={() => setShowPushModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5
                      text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V3M4 7l4-4 4 4" />
                      <path strokeLinecap="round" d="M2 13h12" />
                    </svg>
                    Push to GitHub
                  </button>
                )}
                <button
                  onClick={disconnect}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium
                    text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium
                  text-white hover:bg-zinc-700 transition-colors"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                Connect GitHub
              </button>
            )}
          </div>
        </div>

        
        {statusError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {statusError}
          </p>
        )}
      </div>

     
      {showPushModal && projectId && (
        <PushModal
          projectId={projectId}
          onClose={() => setShowPushModal(false)}
        />
      )}
    </>
  );
}


function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.074.546-.173.546-.385
        0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.364-.924-.888-1.17-.888-1.17
        -.726-.497.055-.487.055-.487.803.057 1.225.825 1.225.825.713 1.222 1.872.869
        2.328.664.072-.517.279-.869.508-1.069-1.776-.202-3.644-.888-3.644-3.953
        0-.874.312-1.588.823-2.147-.082-.202-.356-1.016.078-2.117 0 0 .672-.215
        2.2.82A7.654 7.654 0 0 1 8 3.868c.68.003 1.364.092 2.003.27 1.527-1.035
        2.198-.82 2.198-.82.435 1.101.161 1.915.079 2.117.512.559.822 1.273.822
        2.147 0 3.073-1.871 3.749-3.653 3.947.288.248.543.735.543 1.481 0 1.069-.01
        1.932-.01 2.195 0 .214.144.463.55.385A8.002 8.002 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        className="opacity-25"
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
      />
      <path
        className="opacity-75"
        strokeLinecap="round"
        d="M12 2a10 10 0 0 1 10 10"
      />
    </svg>
  );
}