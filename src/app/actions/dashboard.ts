"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Shipment } from "@/types/database";

/* ── Get current user + profile ─────────────────────────────── */
export async function getDashboardUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return { user, profile };
}

/* ── Get shipment stats ──────────────────────────────────────── */
export async function getDashboardStats() {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: raw } = await (supabase as any)
        .from("shipments")
        .select("status, service_type, declared_value, created_at, recipient_state, weight_kg");

    const shipments = (raw ?? []) as Pick<Shipment, "status" | "service_type" | "declared_value" | "created_at" | "recipient_state" | "weight_kg">[];
    if (!shipments.length && !raw) return null;

    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === "delivered").length;
    const active = shipments.filter(s => !["delivered", "failed"].includes(s.status)).length;
    const failed = shipments.filter(s => s.status === "failed").length;
    const totalValue = shipments.reduce((sum, s) => sum + (Number(s.declared_value) || 0), 0);
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    // Monthly breakdown (last 6 months)
    const monthly: Record<string, number> = {};
    shipments.forEach(s => {
        const mo = new Date(s.created_at).toLocaleString("en-NG", { month: "short" });
        monthly[mo] = (monthly[mo] || 0) + 1;
    });

    // Top destination states
    const stateCount: Record<string, number> = {};
    shipments.forEach(s => {
        if (s.recipient_state) stateCount[s.recipient_state] = (stateCount[s.recipient_state] || 0) + 1;
    });
    const topStates = Object.entries(stateCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([state, count]) => ({ state, count }));

    return { total, delivered, active, failed, totalValue, successRate, monthly, topStates };
}

/* ── Get all shipments (paginated) ──────────────────────────── */
export async function getDashboardShipments(page = 1, pageSize = 20, search = "", status = "") {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from("shipments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (search) query = query.or(
        `tracking_id.ilike.%${search}%,recipient_name.ilike.%${search}%,sender_name.ilike.%${search}%`
    );

    const { data, count, error } = await query as { data: Shipment[] | null; count: number | null; error: { message: string } | null };
    return { shipments: (data ?? []) as Shipment[], count: count ?? 0, error: error?.message ?? null };
}

/* ── Get real wallet balance + transactions + analytics ────────── */
export async function getWalletData() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { balance: 0, transactions: [], stats: { totalFunded: 0, totalSpent: 0, monthlySpent: 0 } };

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Fetch wallet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: wallet } = await (supabase as any)
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

    if (!wallet) {
        await (supabase as any).from("wallets").insert({ user_id: user.id, balance: 0 });
        wallet = { balance: 0 };
    }

    // Fetch transactions & stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: txns } = await (supabase as any)
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    // Calculate Stats
    const totalFunded = (txns ?? []).filter((t: any) => t.type === "credit" && t.status === "success").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    const totalSpent  = (txns ?? []).filter((t: any) => t.type === "debit" && t.status === "success").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    const monthlySpent = (txns ?? []).filter((t: any) => t.type === "debit" && t.status === "success" && t.created_at >= firstDayOfMonth).reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const transactions = (txns ?? []).slice(0, 20).map((t: any) => ({
        id:          t.id,
        type:        t.type,
        amount:      Number(t.amount),
        description: t.description ?? "—",
        date:        t.created_at?.slice(0, 10) ?? "",
        ref:         t.reference ?? "—",
        status:      t.status,
        metadata:    t.metadata || {},
    }));

    return {
        balance: Number(wallet?.balance ?? 0),
        transactions,
        stats: { totalFunded, totalSpent, monthlySpent }
    };
}

/* ── Request a settlement payout ────────────────────────────── */
export async function requestSettlement(data: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
}): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // 1. Debit wallet first (atomic)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: debited, error: debitErr } = await (supabase as any).rpc("debit_wallet_balance", {
        p_user_id: user.id,
        p_amount: data.amount,
    });

    if (debitErr || !debited) return { success: false, error: "Insufficient balance or transaction failed" };

    // 2. Create settlement record
    const reference = `STL-${user.id.slice(0, 5).toUpperCase()}-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stlErr } = await (supabase as any).from("settlements").insert({
        user_id: user.id,
        amount: data.amount,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_name: data.account_name,
        reference,
        status: "pending"
    });

    if (stlErr) {
        // Rollback balance if settlement record fails
        await (supabase as any).rpc("increment_wallet_balance", { p_user_id: user.id, p_amount: data.amount });
        return { success: false, error: "Request failed. Try again." };
    }

    // 3. Record transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("wallet_transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: data.amount,
        reference,
        description: `Settlement Request: ${data.bank_name}`,
        status: "success"
    });

    return { success: true, error: null };
}

/* ── Update business profile ─────────────────────────────────── */
export async function updateBusinessProfile(data: {
    full_name?: string;
    phone?: string;
    state?: string;
    company_name?: string;
}): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("profiles")
        .update({
            full_name:    data.full_name,
            phone:        data.phone,
            state:        data.state,
            account_type: "business",
            // company_name stored in metadata if column exists
            ...(data.company_name ? { company_name: data.company_name } : {}),
        })
        .eq("id", user.id);

    if (error) {
        // Fallback: if company_name column doesn't exist yet, retry without it
        const { error: e2 } = await (supabase as any)
            .from("profiles")
            .update({ full_name: data.full_name, phone: data.phone, state: data.state, account_type: "business" })
            .eq("id", user.id);
        if (e2) return { success: false, error: e2.message };
    }
    return { success: true, error: null };
}
