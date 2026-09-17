"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  { title: string; submitLabel: string; switchPrompt: string; switchHref: string; switchLabel: string }
> = {
  login: {
    title: "Log in to Bubbl",
    submitLabel: "Log in",
    switchPrompt: "Don't have an account?",
    switchHref: "/signup",
    switchLabel: "Sign up",
  },
  signup: {
    title: "Create your Bubbl account",
    submitLabel: "Sign up",
    switchPrompt: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Log in",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const copy = COPY[mode];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setCheckEmail(true);
        return;
      }
      router.push("/universe");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/universe");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-neutral-950 dark:text-white">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          We sent a confirmation link to <strong>{email}</strong>. Follow it
          to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-neutral-950 dark:text-white">
        {copy.title}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Password
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          {loading ? "Please wait…" : copy.submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        {copy.switchPrompt}{" "}
        <Link
          href={copy.switchHref}
          className="font-medium text-neutral-950 underline underline-offset-2 dark:text-white"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
