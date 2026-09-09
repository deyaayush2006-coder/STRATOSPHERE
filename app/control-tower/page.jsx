import { createClient, getStaff } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { readContent } from "@/lib/content";
import Dashboard from "@/components/admin/Dashboard";
import LoginScreen from "@/components/admin/LoginScreen";

/* Reads the session cookie, so it can never be cached or prerendered. */
export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b12] px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">Stratosphere</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Not connected yet</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          The dashboard needs a Supabase project. Apply{" "}
          <code className="text-slate-300">supabase/migrations/0001_init.sql</code>, then set{" "}
          <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. The README has the
          full run-through.
        </p>
        <p className="mt-4 text-xs text-slate-600">
          The public site is unaffected — it is serving its bundled content.
        </p>
      </div>
    </div>
  );
}

export default async function ControlTower() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  /* A session cookie is not proof of anything on its own — it may belong to an
     account an admin has since suspended. getStaff checks the profile too. */
  const staff = await getStaff();
  if (!staff) return <LoginScreen />;

  /* Loaded here rather than in an effect so the editor opens on real content
     instead of a spinner. Reading as the signed-in member means drafts are
     included, which is the whole point of the draft switch. */
  const content = await readContent(await createClient());

  return <Dashboard user={staff} initialContent={content} />;
}
