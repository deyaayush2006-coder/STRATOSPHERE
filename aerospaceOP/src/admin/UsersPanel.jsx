import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Badge, Button, ConfirmButton, FIELD, Label, Notice, Spinner } from "./ui";

/* Account management. Admin-only — the sidebar does not render the link for an
   editor, and the API refuses these routes for one regardless.
   This is how a committee hands over: the outgoing president adds the incoming
   one as an admin, then the new admin suspends the old account. */

function InviteForm({ onCreated }) {
  const empty = { name: "", email: "", password: "", role: "editor" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api.createUser(form);
      setForm(empty);
      onCreated(user);
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-white">Add an account</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Set a password here and pass it on. They can change it from the Account tab once they are in.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>Name</Label>
          <input className={FIELD} value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <Label required>Email</Label>
          <input className={FIELD} type="email" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <Label required hint="At least 8 characters">
            Password
          </Label>
          <input className={FIELD} type="text" value={form.password} onChange={set("password")} required minLength={8} />
        </div>
        <div>
          <Label hint="Admins can manage accounts">Role</Label>
          <select className={FIELD} value={form.role} onChange={set("role")}>
            <option value="editor" className="bg-[#0d1219]">
              Editor — can edit content and upload images
            </option>
            <option value="admin" className="bg-[#0d1219]">
              Admin — that, plus managing accounts
            </option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      <div className="mt-4">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy && <Spinner />}
          Create account
        </Button>
      </div>
    </form>
  );
}

function UserRow({ user, isSelf, onChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  async function patch(body) {
    setBusy(true);
    setError("");
    try {
      const { user: updated } = await api.updateUser(user.id, body);
      onChange(updated);
      return true;
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    if (await patch({ password: newPassword })) {
      setNewPassword("");
      setResetting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <span className="truncate">{user.name}</span>
            {isSelf && <Badge>You</Badge>}
            {!user.isActive && <Badge tone="rose">Suspended</Badge>}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>

        <select
          className={`${FIELD} w-auto py-1.5 text-xs`}
          value={user.role}
          disabled={busy || isSelf}
          title={isSelf ? "You cannot change your own role" : "Change role"}
          onChange={(e) => patch({ role: e.target.value })}
        >
          <option value="editor" className="bg-[#0d1219]">
            Editor
          </option>
          <option value="admin" className="bg-[#0d1219]">
            Admin
          </option>
        </select>

        <Button onClick={() => setResetting((r) => !r)} disabled={busy}>
          Set password
        </Button>

        {!isSelf && (
          <Button onClick={() => patch({ isActive: !user.isActive })} disabled={busy}>
            {user.isActive ? "Suspend" : "Reactivate"}
          </Button>
        )}

        {!isSelf && (
          <ConfirmButton onConfirm={onDelete} confirmLabel="Delete for good?" disabled={busy}>
            Delete
          </ConfirmButton>
        )}
      </div>

      {resetting && (
        <form onSubmit={submitPassword} className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/[0.07] pt-3">
          <div className="min-w-[16rem] flex-1">
            <Label hint="At least 8 characters">New password for {user.name}</Label>
            <input
              className={FIELD}
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && <Spinner />}
            Set
          </Button>
          <Button variant="ghost" onClick={() => setResetting(false)}>
            Cancel
          </Button>
        </form>
      )}

      {error && (
        <div className="mt-3">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      <p className="mt-3 font-mono text-[10px] text-slate-600">
        Added {new Date(user.createdAt).toLocaleDateString()}
        {user.lastLoginAt ? ` · last signed in ${new Date(user.lastLoginAt).toLocaleString()}` : " · never signed in"}
      </p>
    </div>
  );
}

export default function UsersPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listUsers()
      .then(({ users: list }) => {
        setUsers(list);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("ready");
      });
  }, []);

  async function remove(id) {
    setError("");
    try {
      await api.deleteUser(id);
      setUsers((list) => list.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

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
          Who can sign in to this panel. There is no public sign-up — an account exists only because
          someone here created it.
        </p>
      </header>

      {error && (
        <div className="mb-5">
          <Notice onDismiss={() => setError("")}>{error}</Notice>
        </div>
      )}

      <div className="mb-6">
        <InviteForm onCreated={(user) => setUsers((list) => [...list, user])} />
      </div>

      {status === "loading" ? (
        <p className="py-12 text-center text-sm text-slate-400">
          <Spinner /> Loading accounts…
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUser.id}
              onChange={(updated) => setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)))}
              onDelete={() => remove(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
