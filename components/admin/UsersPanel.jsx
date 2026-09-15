"use client";

import { useEffect, useState } from "react";
import { Badge, Button, ConfirmButton, FIELD, Label, Notice, Spinner } from "./ui";
import { createUser, deleteUser, listUsers, updateUser } from "@/app/admin/actions";

/* Who can sign in, and at what level. Admin-only — the tab is not rendered for
   an editor, and every action below re-checks on the server, because a hidden
   tab is a UI convenience and not a permission. */

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor — can change content and upload images" },
  { value: "admin", label: "Admin — the above, plus managing accounts" },
];

function NewAccountForm({ onCreated, onError }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      onCreated(await createUser(form));
      setForm({ name: "", email: "", password: "", role: "editor" });
      setOpen(false);
    } catch (err) {
      onError(err.message);
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Add an account
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-white">New account</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>Name</Label>
          <input className={FIELD} value={form.name} onChange={set("name")} required minLength={2} />
        </div>
        <div>
          <Label required>Email</Label>
          <input className={FIELD} type="email" value={form.email} onChange={set("email")} required />
        </div>
      </div>

      <div>
        <Label required hint="At least 8 characters. Ask them to change it once they are in.">
          Starting password
        </Label>
        <input
          className={FIELD}
          type="text"
          value={form.password}
          onChange={set("password")}
          minLength={8}
          required
        />
      </div>

      <div>
        <Label>Level</Label>
        <select className={FIELD} value={form.role} onChange={set("role")}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0d1219]">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy && <Spinner />}
          Create account
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function UserRow({ user, isSelf, onChanged, onError }) {
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  async function run(fn) {
    setBusy(true);
    onError("");
    try {
      onChanged(await fn());
    } catch (err) {
      onError(err.message);
    }
    setBusy(false);
  }

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">
            {user.name}
            {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>

        <Badge tone={user.role === "admin" ? "cyan" : "slate"}>{user.role}</Badge>
        {!user.is_active && <Badge tone="amber">Suspended</Badge>}
      </div>

      {/* Nothing here is available for your own row: an admin who demotes or
          suspends themselves has no way back short of the Supabase console. */}
      {!isSelf && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
          <select
            className={`${FIELD} w-auto`}
            value={user.role}
            disabled={busy}
            onChange={(e) => run(() => updateUser(user.id, { role: e.target.value }))}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0d1219]">
                {o.value}
              </option>
            ))}
          </select>

          <Button
            disabled={busy}
            onClick={() => run(() => updateUser(user.id, { is_active: !user.is_active }))}
          >
            {user.is_active ? "Suspend" : "Restore"}
          </Button>

          <Button disabled={busy} onClick={() => setResetting((r) => !r)}>
            Set password
          </Button>

          <ConfirmButton
            disabled={busy}
            onConfirm={() => run(() => deleteUser(user.id))}
            confirmLabel="Yes — delete this account"
          >
            Delete
          </ConfirmButton>

          {busy && <Spinner />}
        </div>
      )}

      {resetting && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <Label hint="At least 8 characters">New password</Label>
            <input
              className={FIELD}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <Button
            variant="primary"
            disabled={busy || password.length < 8}
            onClick={() =>
              run(async () => {
                const next = await updateUser(user.id, { password });
                setPassword("");
                setResetting(false);
                return next;
              })
            }
          >
            Save password
          </Button>
        </div>
      )}
    </li>
  );
}

export default function UsersPanel({ currentUser }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listUsers().then(setUsers, (err) => {
      setError(err.message);
      setUsers([]);
    });
  }, []);

  return (
    <div className="pb-16">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          <span className="mr-2" aria-hidden="true">
            🔑
          </span>
          Accounts
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Everyone who can sign in to this dashboard. There is no public sign-up — an account exists
          only because an admin made it here. Suspend an account when a committee member hands over,
          rather than deleting it, so their name stays on the work they did.
        </p>
      </header>

      {error && (
        <div className="mb-5">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      <div className="mb-5">
        <NewAccountForm onCreated={setUsers} onError={setError} />
      </div>

      {users === null ? (
        <p className="py-16 text-center text-sm text-slate-400">
          <Spinner /> Loading accounts…
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUser.id}
              onChanged={setUsers}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
