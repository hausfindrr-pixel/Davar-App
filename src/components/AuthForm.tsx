"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

export function AuthForm() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="w-full max-w-sm rounded-3xl bg-paper border border-mist p-6 text-center">
        <p className="text-sm text-stone">
          Firebase isn&apos;t configured yet. Copy{" "}
          <code>.env.local.example</code> to <code>.env.local</code> and add
          your project&apos;s keys — see README.md.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center text-ink">
        {mode === "signIn" ? "Welcome back" : "Create your account"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-mist bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/70 focus:outline-none focus:ring-2 focus:ring-clay-400"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-mist bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/70 focus:outline-none focus:ring-2 focus:ring-clay-400"
        />
        {error && <p className="text-sm text-clay-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-clay-600 text-paper py-2.5 text-sm font-medium hover:bg-clay-700 transition-colors disabled:opacity-60"
        >
          {mode === "signIn" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={submitting}
        className="rounded-full border border-mist py-2.5 text-sm font-medium text-ink hover:bg-mist/40 transition-colors disabled:opacity-60"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        className="text-xs text-stone underline self-center"
      >
        {mode === "signIn"
          ? "Need an account? Sign up"
          : "Have an account? Sign in"}
      </button>
    </div>
  );
}
