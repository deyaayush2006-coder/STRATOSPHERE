"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { resetSection, saveSection, changeOwnPassword } from "@/app/admin/actions";
import { SECTIONS } from "./schema";
import { Badge, Button, FIELD, Label, Notice, Spinner } from "./ui";
import SectionEditor from "./SectionEditor";
import MediaLibrary from "./MediaLibrary";
import UsersPanel from "./UsersPanel";

// --------------------------------------------------------------- own account

function AccountPanel({ user, onSignOut }) {
  const [newPassword, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await changeOwnPassword(newPassword);
      setNext("");
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-md pb-16">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          <span className="mr-2" aria-hidden="true">
            👤
          </span>
          Your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {user.name} · {user.email} · <Badge tone="cyan">{user.role}</Badge>
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">Change password</h2>
        {/* No "current password" field: Supabase Auth is changing the password
            of the session making the request, and the session is the proof. */}
        <div>
          <Label required hint="At least 8 characters">
            New password
          </Label>
          <input
            className={FIELD}
            type="password"
            value={newPassword}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error && <Notice onDismiss={() => setError("")}>{error}</Notice>}
        {done && <Notice tone="green">Password changed.</Notice>}

        <Button type="submit" variant="primary" disabled={busy}>
          {busy && <Spinner />}
          Change password
        </Button>
      </form>

      <div className="mt-6">
        <Button onClick={onSignOut}>Sign out</Button>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Signs you out on this device. Sessions on other devices are unaffected.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- dashboard

export default function Dashboard({ user, initialContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(SECTIONS[0].key);
  const [navOpen, setNavOpen] = useState(false);

  /* The action returns what is actually in the database now, not an echo of
     the draft. That matters: rows created by this save come back with their
     real ids, and without them the next save would insert duplicates instead
     of updating what it had just created. */
  const save = useCallback(async (key, value) => {
    const saved = await saveSection(key, value);
    setContent((c) => ({ ...c, [key]: saved }));
  }, []);

  const reset = useCallback(async (key) => {
    const restored = await resetSection(key);
    setContent((c) => ({ ...c, [key]: restored }));
  }, []);

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.refresh();
  }

  const tabs = useMemo(() => {
    const extra = [
      { key: "__media", label: "Image library", icon: "🗂️" },
      ...(user.role === "admin" ? [{ key: "__users", label: "Accounts", icon: "🔑" }] : []),
      { key: "__account", label: "Your account", icon: "👤" },
    ];
    return { sections: SECTIONS, extra };
  }, [user.role]);

  const activeSection = SECTIONS.find((s) => s.key === tab);

  function NavLink({ item }) {
    const active = tab === item.key;
    return (
      <button
        type="button"
        onClick={() => {
          setTab(item.key);
          setNavOpen(false);
          window.scrollTo({ top: 0 });
        }}
        aria-current={active ? "page" : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          active ? "bg-cyan-400/12 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
        }`}
      >
        <span aria-hidden="true" className="text-base leading-none">
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-200">
      {/* Sidebar — fixed on desktop, a drawer under the header on mobile. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-[#0b0f16] px-3 py-5
          md:translate-x-0 transition-transform ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-3 pb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400">Stratosphere</p>
          <p className="mt-1 text-sm font-semibold text-white">Site dashboard</p>
        </div>

        <nav className="space-y-0.5">
          {tabs.sections.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </nav>

        <div className="my-4 border-t border-white/[0.07]" />

        <nav className="space-y-0.5">
          {tabs.extra.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </nav>

        <div className="mt-6 space-y-2 px-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-slate-500 transition-colors hover:text-cyan-400"
          >
            View the live site ↗
          </a>
          <button
            type="button"
            onClick={signOut}
            className="block text-xs text-slate-500 transition-colors hover:text-rose-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#080b12]/95 px-5 py-3 backdrop-blur md:hidden">
          <Button variant="ghost" onClick={() => setNavOpen(true)}>
            ☰ Menu
          </Button>
          <span className="truncate text-sm text-slate-300">
            {activeSection?.label || tabs.extra.find((t) => t.key === tab)?.label}
          </span>
        </header>

        <main className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
          {error && (
            <div className="mb-6">
              <Notice onDismiss={() => setError("")}>{error}</Notice>
            </div>
          )}

          {tab === "__media" ? (
            <MediaLibrary />
          ) : tab === "__users" ? (
            <UsersPanel currentUser={user} />
          ) : tab === "__account" ? (
            <AccountPanel user={user} onSignOut={signOut} />
          ) : !content ? (
            <p className="py-24 text-center text-sm text-slate-400">
              <Spinner /> Loading content…
            </p>
          ) : (
            <SectionEditor
              key={activeSection.key}
              section={activeSection}
              value={content[activeSection.key]}
              onSave={save}
              onReset={reset}
            />
          )}
        </main>
      </div>
    </div>
  );
}
