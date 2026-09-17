import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/ui/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <Link href="/universe" className="text-lg font-semibold tracking-tight">
          bubbl.ai
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
