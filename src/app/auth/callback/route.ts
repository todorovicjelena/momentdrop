import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNext } from "@/lib/safe-next";

// Supabase redirects here after Google login and after the user clicks
// the email confirmation link. We swap the one-time ?code for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    // Build the redirect response first and set cookies directly on it —
    // going through next/headers' cookies() here isn't guaranteed to land
    // on a separately-constructed NextResponse, which caused the session to
    // only "stick" after a second navigation.
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) =>
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
    console.error("Auth callback error:", error.code, error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
