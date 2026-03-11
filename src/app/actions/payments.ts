"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE   = "https://api.paystack.co";

/* ── Initialize a wallet top-up transaction ──────────────────────
   Returns the Paystack authorization_url to redirect the user to.
──────────────────────────────────────────────────────────────── */
export async function initializeWalletTopup(amountNaira: number): Promise<{
    authorization_url: string | null;
    reference: string | null;
    error: string | null;
}> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { authorization_url: null, reference: null, error: "Not authenticated" };

    const reference = `PAX-WALLET-${user.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const amountKobo = amountNaira * 100; // Paystack uses kobo

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: user.email,
            amount: amountKobo,
            reference,
            currency: "NGN",
            channels: ["card", "bank", "ussd", "bank_transfer"],
            metadata: {
                user_id: user.id,
                type: "wallet_topup",
                amount_naira: amountNaira,
            },
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/wallet/verify`,
        }),
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
        return { authorization_url: null, reference: null, error: json.message ?? "Payment initialization failed" };
    }

    return {
        authorization_url: json.data.authorization_url,
        reference: json.data.reference,
        error: null,
    };
}

/* ── Verify a Paystack callback and credit the wallet ────────────
   Called from the /dashboard/wallet/verify route after redirect.
──────────────────────────────────────────────────────────────── */
export async function verifyAndCreditWallet(reference: string): Promise<{
    success: boolean;
    amount: number;
    error: string | null;
}> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, amount: 0, error: "Not authenticated" };

    // Verify with Paystack
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const json = await res.json();

    if (!res.ok || !json.status || json.data?.status !== "success") {
        return { success: false, amount: 0, error: "Payment verification failed" };
    }

    const amountNaira = json.data.amount / 100;
    const userId = json.data.metadata?.user_id;

    if (userId !== user.id) {
        return { success: false, amount: 0, error: "User mismatch — cannot credit wallet" };
    }

    // Idempotency check — make sure we haven't processed this reference before
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
        .from("wallet_transactions")
        .select("id")
        .eq("reference", reference)
        .single();

    if (existing) {
        return { success: true, amount: amountNaira, error: null }; // Already processed
    }

    // Credit the wallet balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_wallet_balance", {
        p_user_id: user.id,
        p_amount: amountNaira,
    });

    // Record the transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("wallet_transactions").insert({
        user_id: user.id,
        type: "credit",
        amount: amountNaira,
        reference,
        description: "Wallet Top-up via Paystack",
        status: "success",
    });

    return { success: true, amount: amountNaira, error: null };
}

/* ── Paystack Webhook handler (called from API route) ────────────
   Validates the Paystack signature and processes the event.        
──────────────────────────────────────────────────────────────── */
export async function processPaystackWebhook(payload: string, signature: string): Promise<boolean> {
    const crypto = await import("crypto");
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(payload)
        .digest("hex");

    if (hash !== signature) return false; // Invalid signature

    const event = JSON.parse(payload);

    if (event.event === "charge.success") {
        const ref = event.data?.reference;
        if (ref?.startsWith("PAX-WALLET-")) {
            await verifyAndCreditWallet(ref);
        }
    }

    return true;
}
