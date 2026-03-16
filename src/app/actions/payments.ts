"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = "https://api.paystack.co";

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

/* ── Initialize a per-shipment payment ───────────────────────────
   Used for GUESTS and PERSONAL users who pay per order.
──────────────────────────────────────────────────────────────── */
export async function initializeShipmentPayment(shipmentId: string, amountNaira: number, email: string): Promise<{
    authorization_url: string | null;
    reference: string | null;
    error: string | null;
}> {
    const reference = `PAX-SHIP-${shipmentId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const amountKobo = amountNaira * 100;

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            amount: amountKobo,
            reference,
            currency: "NGN",
            metadata: {
                shipment_id: shipmentId,
                type: "shipment_payment",
            },
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tracking?id=${shipmentId}&payment=success`,
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

import {
    sendBookingConfirmationSMS,
    sendWalletCreditedSMS
} from "@/app/actions/notifications";

import { triggerNotification } from "@/app/actions/notifications";

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

    // Idempotency check 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
        .from("wallet_transactions")
        .select("id")
        .eq("reference", reference)
        .single();

    if (existing) {
        return { success: true, amount: amountNaira, error: null };
    }

    // Credit the wallet balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balance } = await (supabase as any).rpc("increment_wallet_balance", {
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

    // Send multi-channel notification
    try {
        const { data: p } = await (supabase.from("profiles") as any).select("full_name, phone").eq("id", user.id).single();
        const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

        const smsMsg = `Hi ${p?.full_name?.split(" ")[0] || "Merchant"}, your PAX Business Wallet has been credited with ${fmt(amountNaira)}. New Balance: ${fmt(balance || 0)}.`;
        await triggerNotification(user.id, {
            title: "Wallet Funded",
            message: `Your PAX Business wallet has been credited with ${fmt(amountNaira)}.`,
            type: "success",
            url: "/dashboard/wallet",
            phone: p?.phone,
            smsMessage: smsMsg,
            whatsappMessage: smsMsg
        });
    } catch (err) {
        console.error("[WalletNotification] Failed:", err);
    }

    return { success: true, amount: amountNaira, error: null };
}

/* ── Verify shipment payment and confirm the order ──────────────── */
export async function verifyShipmentPayment(reference: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const json = await res.json();

    if (!res.ok || !json.status || json.data?.status !== "success") {
        return { success: false, error: "Payment verification failed" };
    }

    const shipmentId = json.data.metadata?.shipment_id;
    if (!shipmentId) return { success: false, error: "Missing shipment ID in metadata" };

    // Fetch shipment before update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: s } = await (supabase as any).from("shipments").select("*").eq("id", shipmentId).single();

    // Update shipment status to 'confirmed'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("shipments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", shipmentId);

    if (error) return { success: false, error: error.message };

    // Trigger Multi-channel Notification
    if (s) {
        try {
            const eta = new Date(s.estimated_delivery).toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
            const smsMsg = `Hi ${s.sender_name.split(" ")[0]}, your PAX shipment is confirmed! Tracking ID: ${s.tracking_id}. Route: ${s.origin_city} ➜ ${s.destination_city}. ETA: ${eta}. Track: https://panafricanexpress.ng/tracking?id=${s.tracking_id}`;

            await triggerNotification(s.user_id || null, {
                title: "Shipment Confirmed",
                message: `Payment received for ${s.tracking_id}. We are assigning a rider for collection.`,
                type: "success",
                url: `/tracking?id=${s.tracking_id}`,
                phone: s.sender_phone,
                smsMessage: smsMsg,
                whatsappMessage: smsMsg.replace(s.tracking_id, `*${s.tracking_id}*`)
            });
        } catch (err) {
            console.error("[ShipmentNotification] Failed:", err);
        }
    }

    return { success: true, error: null };
}

/* ── Paystack Webhook handler (called from API route) ──────────── */
export async function processPaystackWebhook(payload: string, signature: string): Promise<boolean> {
    const crypto = await import("crypto");
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(payload)
        .digest("hex");

    if (hash !== signature) return false;

    const event = JSON.parse(payload);

    if (event.event === "charge.success") {
        const ref = event.data?.reference;
        if (ref?.startsWith("PAX-WALLET-")) {
            await verifyAndCreditWallet(ref);
        } else if (ref?.startsWith("PAX-SHIP-")) {
            await verifyShipmentPayment(ref);
        }
    }

    return true;
}

/* ── List Banks (Paystack) ─────────────────────────────────── */
export async function listBanks(): Promise<any[]> {
    const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&currency=NGN`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const json = await res.json();
    return json.status ? json.data : [];
}

/* ── Resolve Account Number (Paystack) ─────────────────────── */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{
    account_name: string | null;
    error: string | null;
}> {
    const res = await fetch(`${PAYSTACK_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const json = await res.json();

    if (!res.ok || !json.status) {
        return { account_name: null, error: json.message || "Could not resolve account name" };
    }

    return { account_name: json.data.account_name, error: null };
}

