import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Protect /admin, /account and /dashboard routes
    if (
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/account") ||
        request.nextUrl.pathname.startsWith("/dashboard")
    ) {
        if (!session) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("redirect", request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        const account_type = session.user.user_metadata?.account_type;

        // Strict /admin protection
        if (request.nextUrl.pathname.startsWith("/admin") && account_type !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = account_type === "business" ? "/dashboard" : "/account";
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/account/:path*", "/dashboard/:path*"],
};
