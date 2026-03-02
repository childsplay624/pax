"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

/* ── Sign Up ─────────────────────────────────────────────────── */
export async function signUp(data: {
    email: string;
    password: string;
    full_name: string;
}): Promise<{ error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
    });

    if (error) return { error: error.message };
    return { error: null };
}

/* ── Sign In ─────────────────────────────────────────────────── */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (error) return { error: error.message };
    return { error: null };
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
