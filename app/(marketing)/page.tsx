import Link from "next/link";

import { MarketingNav } from "@/components/landing/marketing-nav";

export default function MarketingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingNav />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
        <div className="relative mb-10 h-40 w-40 sm:h-48 sm:w-48">
          <div className="absolute left-2 top-4 h-20 w-20 rounded-full bg-violet-200/70 blur-[1px] dark:bg-violet-500/20" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-200/70 blur-[1px] dark:bg-sky-500/20" />
          <div className="absolute bottom-0 left-8 h-28 w-28 rounded-full bg-amber-200/60 blur-[1px] dark:bg-amber-400/20" />
          <div className="absolute bottom-4 right-4 h-16 w-16 rounded-full bg-emerald-200/70 blur-[1px] dark:bg-emerald-400/20" />
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
          Your mind, visualized.
        </h1>
        <p className="mt-5 max-w-xl text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
          Capture whatever&rsquo;s on your mind. Bubbl turns it into a living
          map of your thoughts, goals, and ideas — connected, searchable, and
          organized without any effort from you.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-500"
          >
            Log in
          </Link>
        </div>

        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          You think. Bubbl organizes.
        </p>
      </main>
    </div>
  );
}
