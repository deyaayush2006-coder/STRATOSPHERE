import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "../lib/api";
import { DEFAULT_CONTENT } from "../content/defaults";
import { useContentStatus } from "../content/ContentProvider";
import { SECTIONS } from "./schema";
import { Badge, Button, FIELD, Label, Notice, Spinner } from "./ui";
import SectionEditor from "./SectionEditor";
import MediaLibrary from "./MediaLibrary";
import UsersPanel from "./UsersPanel";

/* Keeps the panel out of search results even if the URL leaks.
   The tag has to be injected at runtime: index.html is shared with the public
   site, which very much does want to be indexed. */
function useUnlisted() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive";
    document.head.appendChild(meta);

    const previousTitle = document.title;
    document.title = "Dashboard";

    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);
}

// ------------------------------------------------------------------- login

function LoginScreen({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      onSignedIn(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
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

// --------------------------------------------------------------- own account

function AccountPanel({ user, onSignOut }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api.changePassword(currentPassword, newPassword);
      setToken(token);
      setCurrent("");
      setNext("");
      setDone(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
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
        <div>
          <Label required>Current password</Label>
          <input
            className={FIELD}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
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
          Your session is also dropped whenever this browser tab is closed.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- dashboard

function Dashboard({ user, onSignOut }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(SECTIONS[0].key);
  const [navOpen, setNavOpen] = useState(false);
  const { refresh: refreshPublicSite } = useContentStatus();

  /* What the editor opens on is the *effective* content: whatever is stored,
     falling back to the bundled default for sections nobody has touched yet.
     So a fresh database still opens on the real site content rather than a
     set of empty forms. */
  const load = useCallback(async () => {
    try {
      const { content: remote } = await api.getContent();
      const merged = {};
      for (const key of Object.keys(DEFAULT_CONTENT)) {
        merged[key] = remote?.[key] ?? DEFAULT_CONTENT[key];
      }
      setContent(merged);
    } catch (err) {
      setError(`Could not load the current content: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (key, value) => {
      await api.saveSection(key, value);
      setContent((c) => ({ ...c, [key]: value }));
      refreshPublicSite(); // the public site is mounted in this same tab
    },
    [refreshPublicSite]
  );

  const reset = useCallback(
    async (key) => {
      await api.resetSection(key);
      setContent((c) => ({ ...c, [key]: DEFAULT_CONTENT[key] }));
      refreshPublicSite();
    },
    [refreshPublicSite]
  );

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
            className="block text-xs text-slate-500 transition-colors hover:text-cyan-400"
          >
            View the live site ↗
          </a>
          <button
            type="button"
            onClick={onSignOut}
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
            <AccountPanel user={user} onSignOut={onSignOut} />
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

// --------------------------------------------------------------------- gate

export default function AdminApp() {
  useUnlisted();

  const [user, setUser] = useState(null);
  const [state, setState] = useState(() => (getToken() ? "checking" : "anonymous"));

  /* A token in sessionStorage is not proof of anything — it may be expired, or
     belong to an account that has since been suspended. Ask the server. */
  useEffect(() => {
    if (state !== "checking") return;
    api
      .me()
      .then(({ user: me }) => {
        setUser(me);
        setState("signedIn");
      })
      .catch(() => {
        clearToken();
        setState("anonymous");
      });
  }, [state]);

  function signOut() {
    clearToken();
    setUser(null);
    setState("anonymous");
  }

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080b12] text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (state === "anonymous") {
    return (
      <LoginScreen
        onSignedIn={(me) => {
          setUser(me);
          setState("signedIn");
        }}
      />
    );
  }

  return <Dashboard user={user} onSignOut={signOut} />;
}
