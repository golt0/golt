"use client";

import { login, setToken, signup } from "@/app/lib/api";
import { useGithubStore } from "@/store/project.store";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { AlertCircle, ArrowUp, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useId, useState } from "react";

type Mode = "login" | "signup";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GOLT_GRADIENT = {
  backgroundImage: [
    "radial-gradient(circle at 15% 70%, #4B6DCE 0%, transparent 45%)",
    "radial-gradient(circle at 85% 70%, #4B6DCE 0%, transparent 45%)",
    "radial-gradient(circle at 50% 95%, #E679DA 0%, transparent 38%)",
    "radial-gradient(circle at 50% 130%, #FC2B61 0%, transparent 50%)",
    "radial-gradient(ellipse at top, #222221 0%, #222221 38%, transparent 70%)",
  ].join(", "),
  backgroundColor: "#222221",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
} as const;


function LogoMark() {
  return (
    <div aria-hidden="true" className="h-9 w-9 rounded-xl overflow-hidden">
      <img
        src="/golt.png"
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
}


function Field({
  id,
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  rightElement,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder: string;
  rightElement?: React.ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-white"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-lg border bg-white/[0.04] px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition-colors focus:bg-white/[0.06] ${
            error
              ? "border-red-500/60 focus:border-red-500"
              : "border-white/10 focus:border-white/30"
          } ${rightElement ? "pr-10" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 6 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1 overflow-hidden text-xs text-red-400"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}


function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.66z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.11-6.7-4.94H1.3v3.1C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.3a12 12 0 0 0 0 10.78z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.61l4 3.1C6.24 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-white"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.21.66.8.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-white"
      aria-hidden="true"
    >
      <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.03-.85.86-2 1.48-3.1 1.4-.13-1.1.42-2.26 1.2-3.05.86-.87 2.24-1.5 3.14-1.38ZM19.9 17.24c-.34.78-.5 1.13-.94 1.83-.6.97-1.46 2.19-2.52 2.2-.94.01-1.18-.62-2.46-.61-1.27.01-1.54.62-2.48.6-1.06-.02-1.87-1.11-2.47-2.08-1.7-2.72-1.88-5.9-.83-7.6.75-1.22 1.93-1.93 3.03-1.93 1.13 0 1.83.63 2.76.63.9 0 1.44-.63 2.76-.63.98 0 2.02.53 2.76 1.46-2.43 1.32-2.04 4.83.39 6.13Z" />
    </svg>
  );
}



function ShowcasePanel() {
  return (
    <div className="hidden flex-1 p-6 lg:flex" aria-hidden="true">
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl"
        style={GOLT_GRADIENT}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex w-[90%] max-w-md items-center justify-between gap-4 rounded-2xl bg-white/95 px-5 py-4 shadow-2xl backdrop-blur"
        >
          <p className="text-sm text-neutral-800 sm:text-base">
            Ask Golt to build your app
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              className="ml-0.5 inline-block w-px translate-y-0.5 bg-neutral-800 align-middle"
              style={{ height: "1em" }}
            />
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <ArrowUp className="h-4 w-4" />
          </span>
        </motion.div>
      </div>
    </div>
  );
}


export default function AuthCard({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const uid = useId();
  const shakeControls = useAnimation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [direction, setDirection] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setDirection(next === "signup" ? 1 : -1);
    setMode(next);
    setFieldErrors({});
    setFormError(null);
    router.replace(`/${next}`, { scroll: false });
  }

  async function shake() {
    await shakeControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.45 },
    });
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (mode === "signup" && !name.trim()) {
      errors.name = "Name is required.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (mode === "signup" && password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      shake();
      return;
    }

    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await login(email, password)
          : await signup(name, email, password);

      setToken(data.token);
      useGithubStore.getState().reset();
      router.push("/dashboard");
    } catch {
      setFormError(
        mode === "login"
          ? "Invalid email or password."
          : "Could not create your account. Please try again.",
      );
      shake();
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: "google" | "github" | "apple") {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    window.location.href = `${base}/auth/${provider}`;
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a]">
      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-10 md:px-16 lg:w-[45%] lg:flex-none lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" aria-label="Golt home">
            <LogoMark />
          </Link>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>

          <div className="mt-6 space-y-3">
            <motion.button
              type="button"
              onClick={() => handleOAuth("google")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-3 text-sm text-white transition-colors hover:bg-white/5"
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleOAuth("github")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-3 text-sm text-white transition-colors hover:bg-white/5"
            >
              <GithubIcon />
              Continue with GitHub
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleOAuth("apple")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-3 text-sm text-white transition-colors hover:bg-white/5"
            >
              <AppleIcon />
              Continue with Apple
            </motion.button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs tracking-wide text-neutral-500">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <motion.form
            animate={shakeControls}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={mode}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <Field
                    id={`${uid}-name`}
                    label="Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    error={fieldErrors.name}
                    autoComplete="name"
                    placeholder="Name"
                  />
                )}

                <Field
                  id={`${uid}-email`}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                  autoComplete="email"
                  placeholder="Email"
                />

                <Field
                  id={`${uid}-password`}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  error={fieldErrors.password}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {formError && (
                <motion.div
                  role="alert"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 overflow-hidden rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {loading
                ? mode === "login"
                  ? "Logging in…"
                  : "Creating account…"
                : "Continue"}
            </motion.button>
          </motion.form>

          <p className="mt-5 text-center text-sm text-neutral-400">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-white underline underline-offset-2"
                >
                  Create your account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-white underline underline-offset-2"
                >
                  Log in
                </button>
              </>
            )}
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-neutral-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Your data is encrypted and never shared.
          </div>
        </div>
      </div>

      <ShowcasePanel />
    </div>
  );
}
