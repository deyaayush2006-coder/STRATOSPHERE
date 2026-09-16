import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/* Two jobs, both of which have to happen before a page renders.
 *
 * 1. Refresh the Supabase session. Server Components cannot write cookies, so
 *    without this a committee member is signed out the moment their access
 *    token expires, mid-edit.
 *
 * 2. Serve the dashboard from an unguessable path. The route on disk is
 *    /admin; set NEXT_PUBLIC_ADMIN_PATH and it answers there instead,
 *    while /admin itself stops existing.
 */

const REAL = "admin";
const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH || REAL).replace(/^\/+|\/+$/g, "");

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  /* The password is the security boundary, not the path — a wrong guess still
     meets a login form. What the rename buys is that the panel stays out of
     search results, crawlers and scanner wordlists. Nothing links to it, the
     page serves noindex, and every other URL renders the ordinary home page.
     Change it whenever a committee hands over, alongside the passwords. */
  if (ADMIN_PATH !== REAL) {
    // The real path must not answer once a secret one is set, or the rename
    // buys nothing.
    if (pathname === `/${REAL}` || pathname.startsWith(`/${REAL}/`)) {
      return NextResponse.rewrite(new URL("/404-not-a-real-path", request.url));
    }

    if (pathname === `/${ADMIN_PATH}` || pathname.startsWith(`/${ADMIN_PATH}/`)) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = pathname.replace(`/${ADMIN_PATH}`, `/${REAL}`);
      return withSession(request, NextResponse.rewrite(rewritten));
    }
  }

  return withSession(request, NextResponse.next({ request }));
}

/* Runs the auth refresh and copies any rotated cookies onto the response we
   are actually returning, whether that is a pass-through or a rewrite. */
async function withSession(request, response) {
  /* Before Supabase is wired up there is no session to refresh, and building a
     client on undefined values would throw on every single request. */
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  /* getUser, not getSession: this one actually verifies the token with
     Supabase rather than trusting whatever is in the cookie. */
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /* Everything except static files and images. The public pages are in here
       too — they do not need a session, but the cost is one cookie read, and
       leaving them out would mean a stale session on the first dashboard hit. */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|txt|ico)$).*)",
  ],
};
