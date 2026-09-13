import Link from "next/link";

export default function PremiumFailedPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-ivory">
      <h1 className="text-2xl font-semibold text-ink">Payment didn&apos;t go through</h1>
      <p className="text-sm text-stone max-w-sm">
        No charge was made and nothing on your account has changed. You can
        try again anytime.
      </p>
      <Link
        href="/"
        className="rounded-full border border-mist px-6 py-2.5 text-sm font-medium text-ink hover:bg-mist/40 transition-colors"
      >
        Back to Davar
      </Link>
    </main>
  );
}
