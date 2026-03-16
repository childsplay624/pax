"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
} from "@/app/actions/notifications";
import { logger } from "@/lib/logger";

/* ── Rate Limiter Helper ──────────────────────────────────────── */
async function checkLimit(key: string, max: number, refillRate: number): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allowed } = await (supabaseAdmin as any).rpc("check_rate_limit", {
        p_key: key,
        p_max_tokens: max,
        p_refill_rate_seconds: refillRate
    });
    return !!allowed;
}

/* ── Sign Up ─────────────────────────────────────────────────── */
export async function signUp(data: {
    email: string;
    password: string;
    full_name: string;
    account_type?: "personal" | "business";
}): Promise<{ error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // Ensure admin is NEVER allowed from public registration
    const safeType = (data.account_type === "business") ? "business" : "personal";

    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.full_name,
                account_type: safeType,
            },
        },
    });

    if (error) {
        await logger.error("Sign up failed", { error: error.message, email: data.email }, "auth:signUp");
        return { error: error.message };
    }

    // ── Generate Verification Link via Admin API ────────────
    if (authData.user) {
        try {
            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                type: "signup",
                email: data.email,
                password: data.password,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                    data: { full_name: data.full_name, account_type: safeType }
                }
            });

            if (!linkErr && linkData?.properties?.action_link) {
                await sendVerificationEmail(data.email, linkData.properties.action_link);
                await logger.info("Sign up verification email sent", { email: data.email }, "auth:signUp", authData.user.id);
            }
        } catch (err) {
            await logger.error("Sign up link generation crashed", { error: err, email: data.email }, "auth:signUp");
        }
    }

    // If user was auto-confirmed (unlikely if verify is on), update profile immediately
    if (authData.user && authData.session) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from("profiles")
            .upsert({
                id: authData.user.id,
                full_name: data.full_name,
                account_type: safeType,
            }, { onConflict: "id" });

        // Send Welcome Email
        await sendWelcomeEmail(data.email, data.full_name);
    }

    return { error: null };
}

/* ── Forgot Password ────────────────────────────────────────── */
export async function forgotPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
        // Rate Limit: 3 resets per email per hour
        const isAllowed = await checkLimit(`reset:${email}`, 3, 3600);
        if (!isAllowed) return { success: false, error: "Too many reset attempts. Please try again in an hour." };

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
            }
        });

        if (error) {
            await logger.error("Forgot password request failed", { email, error: error.message }, "auth:forgotPassword");
            return { success: false, error: error.message };
        }

        if (data?.properties?.action_link) {
            await sendPasswordResetEmail(email, data.properties.action_link);
            await logger.info("Password reset link generated & sent", { email }, "auth:forgotPassword");
            return { success: true, error: null };
        }

        await logger.warn("Password reset link generation returned no link", { email }, "auth:forgotPassword");
        return { success: false, error: "Failed to generate reset link" };
    } catch (err: any) {
        await logger.fatal("Forgot password action crashed", { error: err.message, email }, "auth:forgotPassword");
        return { success: false, error: err.message };
    }
}

/* ── Sign In ─────────────────────────────────────────────────── */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ error: string | null; account_type: "personal" | "business" | "admin" | "rider" | null }> {
    const supabase = await createServerSupabaseClient();

    // Rate Limit: 5 login attempts per 15 minutes to prevent brute force
    const isAllowed = await checkLimit(`login:${data.email}`, 5, 900);
    if (!isAllowed) return { error: "Too many login attempts. Please wait 15 minutes.", account_type: null };

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (error) {
        await logger.warn("Sign in attempt failed", { email: data.email, error: error.message }, "auth:signIn");
        return { error: error.message, account_type: null };
    }

    if (!authData.user) {
        await logger.error("Sign in returned no user", { email: data.email }, "auth:signIn");
        return { error: "No user returned", account_type: null };
    }

    const userId = authData.user.id;
    await logger.info("User signed in successfully", { email: data.email }, "auth:signIn", userId);

    // ── 1. Check riders table first (highest priority check) ────
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rider } = await (supabase as any)
            .from("riders")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

        if (rider) return { error: null, account_type: "rider" };
    } catch {
        // riders table may not exist yet — safe to skip
    }

    // ── 2. Check profiles for admin / business ───────────────
    let account_type: "personal" | "business" | "admin" = "personal";
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("account_type")
            .eq("id", userId)
            .single() as { data: { account_type: string } | null };

        if (profile?.account_type === "business") account_type = "business";
        else if (profile?.account_type === "admin") account_type = "admin";
    } catch {
        // profiles table may not exist yet — fall back to personal
    }

    return { error: null, account_type };
}

/* ── Sign Out ────────────────────────────────────────────────── */
export async function signOut(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

/* ── Get current session user ───────────────────────────────── */
export async function getUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
