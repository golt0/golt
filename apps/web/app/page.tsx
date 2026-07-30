"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getToken } from "./lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if(token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [])

  return null;
}