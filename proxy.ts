import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: plik to `proxy.ts` (dawniej `middleware.ts`), runtime nodejs.
// Odświeża sesję Supabase i chroni trasy: brak sesji → /login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Nie wstawiaj logiki między createServerClient a getUser() — odświeża sesję.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/login";
  // Trasy publiczne (bez redirectu na /login):
  // - /api/* — uwierzytelniają się same (sesja cookie albo klucz API) i zwracają JSON;
  //   redirect 302 na HTML /login zepsułby publiczne API.
  // - /docs (i podstrony, np. /docs/mcp) — publiczna dokumentacja API/MCP.
  const isPublic =
    isAuthRoute || pathname.startsWith("/api") || pathname.startsWith("/docs");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Pomija statyki i _next.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
