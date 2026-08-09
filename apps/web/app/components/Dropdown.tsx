"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Settings,
  CircleHelp, 
  HelpCircle,
  Book,
  Users,
  Home,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { getMe, logout } from "../lib/api";
import { useGithubStore } from "@/store/project.store";

interface User  {
 id : string;
 name : string;
 email: string;
}


export default function UserDropdownMenu() {
  const [user , setUser] = useState<User | null>(null)
  const [loading , setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    useEffect(() => {
    getMe().then((data) => setUser(data.user || data))
    .catch((err) => console.error("falied to load user:" , err ))
    .finally(() => setLoading(false))
  },  []);

  const handleSignOut = () => {
    useGithubStore.getState().reset();
    if(typeof logout === "function") {
        logout();
    } else {
        localStorage.removeItem("token");
        window.location.href = "/login"
    }
  }

  const UserFirstLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : "?";

  if(loading) return <div>Loading...</div>

  return (
    <div className="relative inline-block" ref={menuRef}>
    
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-[300px] rounded-2xl bg-[#1e1e1e] border border-[#333] shadow-2xl text-white font-sans overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5d443a] text-lg font-medium text-[#e8d5cc]">
              {UserFirstLetter}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-semibold text-[15px] leading-tight">
               {user?.name || "User"}
              </span>
              <span className="truncate text-[13px] text-zinc-400 mt-0.5">
                {user?.email || ""}
              </span>
            </div>
          </div>

          <div className="h-px bg-[#333] w-full" />

          <div className="py-2">
            <MenuItem icon={<User size={18} />} label="Profile" />
            <MenuItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              rightElement={<span className="text-[11px] text-zinc-500 font-mono tracking-wider">Ctrl .</span>}
            />
            <MenuItem 
              icon={<CircleHelp size={18} />} 
              label="Appearance" 
              rightElement={<ChevronRight size={16} className="text-zinc-500" />}
            />
            <MenuItem 
              icon={<HelpCircle size={18} />} 
              label="Support" 
              rightElement={<ChevronRight size={16} className="text-zinc-500" />}
            />
            <MenuItem 
              icon={<Book size={18} />} 
              label="Documentation" 
              rightElement={<ChevronRight size={16} className="text-zinc-500" />}
            />
            <MenuItem icon={<Users size={18} />} label="Community" />
            <MenuItem icon={<Home size={18} />} label="Homepage" />
          </div>

          <div className="h-px bg-[#333] w-full" />

         
          <div className="py-2">
            <MenuItem icon={<LogOut size={18} />} onClick={() => handleSignOut()} label="Sign out" />
          </div>
        </div>
      )}

     
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3f322d] border border-[#52443e] hover:bg-[#4d3d37] transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
        aria-label="Toggle user menu"
      >
        <span className="text-lg font-medium text-[#e8d5cc]">{UserFirstLetter}</span>
      </button>
    </div>
  );
}


function MenuItem({ 
  icon, 
  label, 
  rightElement,
  onClick
}: { 
  icon: React.ReactNode; 
  label: string; 
  rightElement?: React.ReactNode;
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-zinc-200 hover:bg-[#2a2a2a] transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-zinc-400">{icon}</div>
        <span className="text-[14px] font-medium">{label}</span>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
}