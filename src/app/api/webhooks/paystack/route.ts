import { NextRequest, NextResponse } from "next/server";
import { processPaystackWebhook } from "@/app/actions/payments";

/* ── Paystack Webhook ────────────────────────────────────────────
   Paystack sends POST requests here for payment events.
   The signature header is used to verify authenticity.
──────────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
    const body      = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";

    const valid = await processPaystackWebhook(body, signature);

    if (!valid) {
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    return NextResponse.json({ message: "OK" });
}
