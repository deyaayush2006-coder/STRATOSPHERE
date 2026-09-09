import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* The signed-in client, for the dashboard and its server actions.
   Every query it makes runs as the logged-in committee member, so the row
   level security policies in the migration are the whole authorisation story
   — there is no second set of permission checks in application code. */
export async function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /* Called from a Server Component, where cookies are read-only.
               The middleware refreshes the session instead, so this is safe
               to swallow rather than crash a page render. */
          }
        },
      },
    }
  );
}

/* Who is signed in, with their committee role, or null.
   Reads the profile too: an account an admin has suspended still has a valid
   auth session, and must not be treated as staff. */
export async function getStaff() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null; // not configured yet; the caller shows the setup notice
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;
  return profile;
}
