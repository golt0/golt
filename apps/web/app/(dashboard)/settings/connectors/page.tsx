"use client";

import { GithubConnector } from "@/app/components/GithubConnector";

export default function ConnectorsSettingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl py-10">
      <h1 className="mb-1 text-xl font-semibold text-white">Connectors</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Connect third-party services to your account.
      </p>

      <GithubConnector />
    </main>
  );
}
