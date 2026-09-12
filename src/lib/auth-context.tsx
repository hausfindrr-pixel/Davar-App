"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserDoc } from "@/lib/db/users";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED_MESSAGE =
  "Firebase isn't configured yet. Copy .env.local.example to .env.local and add your project's keys — see README.md.";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Always starts `true`, on both server and client: `auth` is intentionally
  // always `undefined` during SSR (see firebase.ts), so deriving the initial
  // value from it here would render different output server- vs.
  // client-side and break hydration. It only ever changes after mount.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Nothing to subscribe to — there's no async auth state to wait for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        await ensureUserDoc(nextUser);
      }
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async signInWithEmail(email, password) {
      if (!auth) throw new Error(NOT_CONFIGURED_MESSAGE);
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUpWithEmail(email, password) {
      if (!auth) throw new Error(NOT_CONFIGURED_MESSAGE);
      await createUserWithEmailAndPassword(auth, email, password);
    },
    async signInWithGoogle() {
      if (!auth) throw new Error(NOT_CONFIGURED_MESSAGE);
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    async signOut() {
      if (!auth) return;
      await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
