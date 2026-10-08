import { createClient, getStaff } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { readContent } from "@/lib/content";
import Dashboard from "@/components/control-tower/Dashboard";
import LoginScreen from "@/components/control-tower/LoginScreen";

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

export default async function AdminPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const staff = await getStaff();
  if (!staff) return <LoginScreen />;

  const content = await readContent(await createClient(), { includePrivate: true });

  return <Dashboard user={staff} initialContent={content} />;
}
