"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function Spinner() {
  return (
    <>
      <style>{`
        @keyframes nikah-spin {
          to { transform: rotate(360deg); }
        }
        .nikah-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(15, 17, 25, 0.3);
          border-top-color: #0f1119;
          border-radius: 50%;
          animation: nikah-spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
      `}</style>
      <span className="nikah-spinner" aria-hidden="true" />
    </>
  );
}

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        // Email confirmation required — session won't exist yet
        if (!data.session) {
          setInfo("Check your email and click the confirmation link, then sign in.");
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      // push first, then refresh so the new cookie is sent with the navigation
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#0f1119" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "#1e2235" }}
      >
        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#c8a96e" }}
          >
            Nikah AI
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8698" }}>
            Your AI Wakeel
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="mb-6 flex rounded-lg p-1"
          style={{ backgroundColor: "#0f1119" }}
        >
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
              style={
                mode === m
                  ? { backgroundColor: "#1e2235", color: "#c8a96e" }
                  : { color: "#8a8698" }
              }
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                className="mb-1 block text-xs font-medium uppercase tracking-widest"
                style={{ color: "#8a8698" }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Akhror Khan"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-1"
                style={{
                  backgroundColor: "#0f1119",
                  borderColor: "#2e3250",
                  color: "#f0ece8",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c8a96e")}
                onBlur={(e) => (e.target.style.borderColor = "#2e3250")}
              />
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-xs font-medium uppercase tracking-widest"
              style={{ color: "#8a8698" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-1"
              style={{
                backgroundColor: "#0f1119",
                borderColor: "#2e3250",
                color: "#f0ece8",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c8a96e")}
              onBlur={(e) => (e.target.style.borderColor = "#2e3250")}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium uppercase tracking-widest"
              style={{ color: "#8a8698" }}
            >
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "#0f1119",
                borderColor: "#2e3250",
                color: "#f0ece8",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c8a96e")}
              onBlur={(e) => (e.target.style.borderColor = "#2e3250")}
            />
          </div>

          {info && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#1a2a1e", color: "#6fcf97" }}>
              {info}
            </p>
          )}

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#2e1a1a", color: "#e07070" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg py-3 text-sm font-semibold tracking-wide transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#c8a96e", color: "#0f1119" }}
          >
            {loading && <Spinner />}
            {loading
              ? mode === "signin" ? "Signing in…" : "Creating account…"
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "#8a8698" }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
            className="font-medium underline underline-offset-2"
            style={{ color: "#c8a96e" }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
