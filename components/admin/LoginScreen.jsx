"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, FIELD, Label, Notice, Spinner } from "./ui";

/* Sign-in and the dashboard live at the same URL, the way they did before the
   move to Next. It keeps the panel to a single route, which matters because
   NEXT_PUBLIC_ADMIN_PATH renames that route — a redirect to a second one would
   have to know the secret name, and would leak it in the address bar. */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error: signInError } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      /* Supabase says "Invalid login credentials" whether it was the address
         or the password, which is the right answer to give a stranger. */
      setError(signInError.message);
      setBusy(false);
      return;
    }

    /* The session cookie is set now, so re-run the server component that
       decides between this screen and the dashboard. */
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b12] px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">Stratosphere</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Site dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Committee access only.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="space-y-4">
            <div>
              <Label required>Email</Label>
              <input
                className={FIELD}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div>
              <Label required>Password</Label>
              <input
                className={FIELD}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4">
              <Notice onDismiss={() => setError("")}>{error}</Notice>
            </div>
          )}

          <Button type="submit" variant="primary" className="mt-5 w-full" disabled={busy}>
            {busy && <Spinner />}
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
          Forgotten the password? Another admin can set a new one from the Accounts tab.
        </p>
      </div>
    </div>
  );
}
