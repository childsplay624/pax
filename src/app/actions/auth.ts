"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

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

    if (error) return { error: error.message };

    // If user was auto-confirmed (no email verify needed), update profile immediately
    if (authData.user && authData.session) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from("profiles")
            .upsert({
                id: authData.user.id,
                full_name: data.full_name,
                account_type: safeType,
            }, { onConflict: "id" });
    }

    return { error: null };
}

/* ── Sign In ─────────────────────────────────────────────────── */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ error: string | null; account_type: "personal" | "business" | "admin" | "rider" | null }> {
    const supabase = await createServerSupabaseClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (error) return { error: error.message, account_type: null };

    if (!authData.user) return { error: "No user returned", account_type: null };

    const userId = authData.user.id;

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
