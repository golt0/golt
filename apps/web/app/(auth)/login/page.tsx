"use client";

import { login, setToken } from "@/app/lib/api";
import { useGithubStore } from "@/store/project.store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";



export default function LoginPage() {
    const router = useRouter();

    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [loading , setLoading] = useState(false);


    async function handleSubmit(e : React.FormEvent)  {
       e.preventDefault();
       setLoading(true);

       try {
        const data = await login(email , password);
        setToken(data.token);
        useGithubStore.getState().reset();
        router.push('/dashboard')

       } catch (error) {
        setLoading(false)
       }
    }
   return (
    <div>
        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
            <input type="email"
            placeholder="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />

            <input type="password" 
            placeholder="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} />

            <button type="submit" disabled={loading}>
               {loading ? 'logging in...' : "login"}
            </button>


        </form>
         <Link href="/signup">
              does not have account ? signup
        </Link>
    </div>
   )
}