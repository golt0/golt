"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} />


      <main className="flex-1 overflow-y-auto bg-black/40 p-6">
        {children}
      </main>
    </div>
  );
}