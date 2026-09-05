import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const SELLER_PREFIX = "/seller";
const ADMIN_PREFIX = "/admin";
const CUSTOMER_ONLY_PREFIX = "/account";
// Any signed-in user (customer or seller) can open /sell/new — that page is
// also where a plain customer becomes a seller, so it isn't role-gated here.
const SELL_PREFIX = "/sell";
const AUTH_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Refreshes the Supabase session on every request and enforces coarse
 * role-based route protection. Fine-grained permission checks still happen
 * server-side per query via RLS — this middleware is a fast, cheap first
 * gate so unauthenticated/unauthorized users never render a protected page.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const needsAuth =
    pathname.startsWith(SELLER_PREFIX) ||
    pathname.startsWith(ADMIN_PREFIX) ||
    pathname.startsWith(CUSTOMER_ONLY_PREFIX) ||
    pathname.startsWith(SELL_PREFIX);

  if (needsAuth && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname.startsWith(SELLER_PREFIX) || pathname.startsWith(ADMIN_PREFIX))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile?.status !== "active") {
      return NextResponse.redirect(new URL("/account/blocked", request.url));
    }

    if (pathname.startsWith(ADMIN_PREFIX) && !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (
      pathname.startsWith(SELLER_PREFIX) &&
      !["seller", "admin"].includes(profile.role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}
