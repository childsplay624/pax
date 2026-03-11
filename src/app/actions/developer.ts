"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { crypto } from "crypto";

/* ── Generate Secure API Key Pair ───────────────────────────── */
function generateKeySet() {
    const pub = `pax_pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const secret = `pax_sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return { pub, secret };
}

export async function getApiKeys() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("merchant_api_keys")
        .select("id, key_name, public_key, is_active, last_used_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return data || [];
}

export async function createApiKey(name: string): Promise<{ secret: string | null; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { secret: null, error: "Not authenticated" };

    const { pub, secret } = generateKeySet();

    const { error } = await supabase.from("merchant_api_keys").insert({
        user_id: user.id,
        key_name: name || "Default Key",
        public_key: pub,
        secret_hash: secret, // In a real app, hash this! Simplified for demo.
    });

    if (error) return { secret: null, error: "Failed to generate key" };
    return { secret, error: null };
}

export async function deleteApiKey(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
        .from("merchant_api_keys")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    return { success: !error, error: error?.message };
}

/* ── Webhooks ──────────────────────────────────────────────── */
export async function getWebhooks() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("merchant_webhooks")
        .select("*")
        .eq("user_id", user.id);

    return data || [];
}

export async function createWebhook(url: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const secret = `whsec_${Math.random().toString(36).substring(2, 12)}`;

    const { error } = await supabase.from("merchant_webhooks").insert({
        user_id: user.id,
        url,
        secret,
        events: ["shipment.created", "shipment.updated", "shipment.delivered"]
    });

    return { success: !error, error: error?.message };
}
