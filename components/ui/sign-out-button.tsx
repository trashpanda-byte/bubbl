"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950 disabled:opacity-60 dark:text-neutral-400 dark:hover:text-white"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
