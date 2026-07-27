"use client";

import { setToken, signup } from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
    const router = useRouter();

    const [name , setName] = useState("");
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [loading , setLoading] = useState(false);

    async function handleSubmit(e : React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await signup(name , email , password);
            setToken(data.token);
            router.push('/dashboard')
        } catch (error) {
            setLoading(false)
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
              <input type="name"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              />

              <input type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              />
              <input type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? 'loading in...' : "signup"}
              </button>
            </form>

            <Link href="/login">
             account already exists ? login
            </Link>
        </div>
    )
}
