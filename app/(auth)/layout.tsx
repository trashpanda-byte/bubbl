import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-10 text-lg font-semibold tracking-tight text-neutral-950 dark:text-white"
      >
        bubbl.ai
      </Link>
      {children}
    </div>
  );
}
