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

    const { data: { user } } = await supabase.auth.getUser();

    // Protect /admin, /account, /dashboard, and /rider routes
    if (
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/account") ||
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/rider") ||
        request.nextUrl.pathname.startsWith("/riders")
    ) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("redirect", request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        let account_type = user.user_metadata?.account_type;

        // Fallback: If metadata is missing account_type, fetch from profiles
        if (!account_type) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("account_type")
                .eq("id", user.id)
                .single();

            if (profile) {
                account_type = profile.account_type;
            } else {
                // Secondary fallback: check if they are in the riders table
                const { data: rider } = await supabase
                    .from("riders")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (rider) account_type = "rider";
            }
        }

        // Redirect Riders to their dashboard if they try to access merchant/personal/booking areas
        if (
            (request.nextUrl.pathname.startsWith("/dashboard") ||
                request.nextUrl.pathname.startsWith("/account") ||
                request.nextUrl.pathname.startsWith("/book")) &&
            account_type === "rider"
        ) {
            return NextResponse.redirect(new URL("/rider", request.url));
        }

        // Strict /admin protection
        if (request.nextUrl.pathname.startsWith("/admin") && account_type !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = account_type === "rider" ? "/rider" : (account_type === "business" ? "/dashboard" : "/account");
            return NextResponse.redirect(url);
        }

        // Strict /rider protection (excluding the /riders application route)
        if (request.nextUrl.pathname.startsWith("/rider") && !request.nextUrl.pathname.startsWith("/riders") && account_type !== "rider") {
            const url = request.nextUrl.clone();
            url.pathname = account_type === "admin" ? "/admin" : (account_type === "business" ? "/dashboard" : "/account");
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/account/:path*", "/dashboard/:path*", "/rider/:path*", "/riders/:path*", "/book/:path*"],
};
