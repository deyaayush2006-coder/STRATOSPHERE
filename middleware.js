import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const REAL = "admin";
const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH || REAL).replace(/^\/+|\/+$/g, "");

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (ADMIN_PATH !== REAL) {
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

async function withSession(request, response) {
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

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|txt|ico|xml)$).*)",
  ],
};
