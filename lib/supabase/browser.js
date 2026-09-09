"use client";

import { createBrowserClient } from "@supabase/ssr";

/* The dashboard's own client. Used for signing in, and for pushing image
   bytes straight to Storage — an upload that went through a server action
   would have to fit in the request body limit and be buffered twice. */
let client;

export function supabaseBrowser() {
  client ||= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return client;
}
