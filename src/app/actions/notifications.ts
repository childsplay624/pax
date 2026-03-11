"use server";

const TERMII_API_KEY  = process.env.TERMII_API_KEY!;
const TERMII_BASE     = "https://v3.api.termii.com/api";
const SENDER_ID       = process.env.TERMII_SENDER_ID ?? "PAN Express";

/* ── Normalize Nigerian phone number to international format ─── */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return digits;
}

/* ── Send a single SMS via Termii ───────────────────────────────
   channel: "generic" (SMS) | "generic" with WhatsApp fallback
──────────────────────────────────────────────────────────────── */
async function sendSMS(to: string, message: string, channel: "generic" | "whatsapp" = "generic"): Promise<boolean> {
    if (!TERMII_API_KEY) {
        console.warn("[Termii] TERMII_API_KEY not set — skipping SMS");
        return false;
    }

    try {
        const res = await fetch(`${TERMII_BASE}/sms/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: normalizePhone(to),
                from: SENDER_ID,
                sms: message,
                type: "plain",
                channel,
                api_key: TERMII_API_KEY,
            }),
        });

        const json = await res.json();
        if (!res.ok || json.code !== "ok") {
            console.error("[Termii] SMS failed:", json);
            return false;
        }
        return true;
    } catch (err) {
        console.error("[Termii] Fetch error:", err);
        return false;
    }
}

/* ── Booking Confirmation SMS ───────────────────────────────────
   Sent to sender immediately after a shipment is booked.
──────────────────────────────────────────────────────────────── */
export async function sendBookingConfirmationSMS(data: {
    senderPhone: string;
    senderName: string;
    trackingId: string;
    origin: string;
    destination: string;
    eta: string;
}): Promise<void> {
    const msg =
        `Hi ${data.senderName.split(" ")[0]}, your PAX shipment is confirmed! ` +
        `Tracking ID: ${data.trackingId}. ` +
        `Route: ${data.origin} → ${data.destination}. ` +
        `ETA: ${data.eta}. ` +
        `Track live: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.senderPhone, msg);
}

/* ── Delivery Notification SMS ──────────────────────────────────
   Sent to recipient when the shipment is "Out for Delivery".
──────────────────────────────────────────────────────────────── */
export async function sendOutForDeliverySMS(data: {
    recipientPhone: string;
    recipientName: string;
    trackingId: string;
    address: string;
}): Promise<void> {
    const msg =
        `Hi ${data.recipientName.split(" ")[0]}, your PAX parcel is out for delivery today! ` +
        `It will be delivered to: ${data.address}. ` +
        `Your OTP for collection: ${Math.floor(100000 + Math.random() * 900000)}. ` +
        `Track: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.recipientPhone, msg);
}

/* ── Delivery Success SMS ───────────────────────────────────────
   Sent to sender once the shipment is marked "Delivered".
──────────────────────────────────────────────────────────────── */
export async function sendDeliveredSMS(data: {
    senderPhone: string;
    senderName: string;
    trackingId: string;
    recipientName: string;
    destination: string;
}): Promise<void> {
    const msg =
        `Great news, ${data.senderName.split(" ")[0]}! Your parcel ${data.trackingId} has been successfully delivered to ` +
        `${data.recipientName} in ${data.destination}. Thank you for choosing PAN African Express!`;

    await sendSMS(data.senderPhone, msg);
}

/* ── Status Update SMS ──────────────────────────────────────────
   Generic status change alert. Called from admin panel updates.
──────────────────────────────────────────────────────────────── */
export async function sendStatusUpdateSMS(data: {
    phone: string;
    name: string;
    trackingId: string;
    status: string;
    location: string;
}): Promise<void> {
    const statusLabels: Record<string, string> = {
        collected:        "picked up by our courier",
        in_transit:       "now in transit",
        at_hub:           `arrived at our ${data.location} hub`,
        out_for_delivery: "out for delivery",
        delivered:        "delivered successfully",
        failed:           "could not be delivered (our team will retry)",
    };

    const label = statusLabels[data.status] ?? `updated to: ${data.status}`;
    const msg =
        `PAX Update — Hi ${data.name.split(" ")[0]}, your parcel ${data.trackingId} has been ${label}. ` +
        `Track: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.phone, msg);
}

/* ── Wallet Funded SMS ──────────────────────────────────────────
   Sent to merchant after a successful Paystack wallet top-up.
──────────────────────────────────────────────────────────────── */
export async function sendWalletCreditedSMS(data: {
    phone: string;
    name: string;
    amount: number;
    newBalance: number;
}): Promise<void> {
    const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
    const msg =
        `Hi ${data.name.split(" ")[0]}, your PAX Business Wallet has been credited with ${fmt(data.amount)}. ` +
        `New Balance: ${fmt(data.newBalance)}. ` +
        `Start shipping at: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/dashboard`;

    await sendSMS(data.phone, msg);
}
