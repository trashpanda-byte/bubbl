import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <span className="text-lg font-semibold tracking-tight">bubbl.ai</span>
      <nav className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
