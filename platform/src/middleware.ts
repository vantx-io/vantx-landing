import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first (handles locale redirect/detection)
  const response = intlMiddleware(request);

  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = routing.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  const locale = pathnameLocale || routing.defaultLocale;

  // Strip locale prefix for route matching
  const pathWithoutLocale = pathnameLocale
    ? pathname.replace(`/${pathnameLocale}`, "") || "/"
    : pathname;

  // Only run auth check on portal, admin, and login routes
  if (
    !pathWithoutLocale.startsWith("/portal") &&
    !pathWithoutLocale.startsWith("/admin") &&
    pathWithoutLocale !== "/login"
  ) {
    return response;
  }

  // Auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /portal routes
  if (pathWithoutLocale.startsWith("/portal") && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Redirect logged-in users from login to portal
  if (pathWithoutLocale === "/login" && user) {
    return NextResponse.redirect(new URL(`/${locale}/portal`, request.url));
  }

  // Protect /admin routes — require admin/engineer/seller role (per D-01, D-02, D-03)
  if (pathWithoutLocale.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const adminRoles: string[] = ["admin", "engineer", "seller"];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL(`/${locale}/portal`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
