import Link from "next/link";

export default function PremiumSuccessPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-ivory">
      <h1 className="text-2xl font-semibold text-ink">Payment received</h1>
      <p className="text-sm text-stone max-w-sm">
        Thank you — your payment is confirmed. Premium unlocks on your account
        automatically once the network confirms it, usually within a few
        minutes. You don&apos;t need to do anything else — just head back and
        your dashboard will update on its own.
      </p>
      <Link
        href="/?upgraded=1"
        className="rounded-full bg-clay-600 text-paper px-6 py-2.5 text-sm font-medium hover:bg-clay-700 transition-colors"
      >
        Back to Davar
      </Link>
    </main>
  );
}
