"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendStatusUpdateSMS, sendDeliveredSMS } from "@/app/actions/notifications";

/* ── Update shipment status + auto-fire Termii SMS ──────────────
   Called from the admin shipments panel when an admin changes a status.
──────────────────────────────────────────────────────────────── */
export async function updateShipmentStatus(
    shipmentId: string,
    newStatus: string,
    currentLocation?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // Fetch the shipment details first (we need phone numbers for SMS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipment, error: fetchErr } = await (supabase as any)
        .from("shipments")
        .select("id, tracking_id, status, sender_name, sender_phone, recipient_name, recipient_phone, destination_city, origin_city")
        .eq("id", shipmentId)
        .single();

    if (fetchErr || !shipment) return { success: false, error: "Shipment not found" };

    // Update the status in DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
        .from("shipments")
        .update({ status: newStatus })
        .eq("id", shipmentId);

    if (updateErr) return { success: false, error: "Status update failed" };

    // Update the matching tracking event to 'done' and mark next as 'current'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: events } = await (supabase as any)
        .from("tracking_events")
        .select("id, status, sort_order")
        .eq("tracking_id", shipment.tracking_id)
        .order("sort_order", { ascending: true });

    if (events && events.length > 0) {
        // Mark all events up to (and including) current status as 'done'
        const statusEventMap: Record<string, number> = {
            confirmed: 1, collected: 2, in_transit: 3,
            at_hub: 4, out_for_delivery: 5, delivered: 6, failed: 6,
        };
        const currentStep = statusEventMap[newStatus] ?? 0;

        for (const ev of events) {
            let evStatus = "upcoming";
            if (ev.sort_order < currentStep) evStatus = "done";
            else if (ev.sort_order === currentStep) evStatus = newStatus === "delivered" ? "done" : "current";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("tracking_events")
                .update({ status: evStatus })
                .eq("id", ev.id);
        }
    }

    // Fire SMS notifications (non-blocking — we fire-and-forget)
    const location = currentLocation ?? shipment.destination_city ?? "";

    if (newStatus === "delivered") {
        // Notify sender of successful delivery
        if (shipment.sender_phone) {
            sendDeliveredSMS({
                senderPhone: shipment.sender_phone,
                senderName: shipment.sender_name ?? "Customer",
                trackingId: shipment.tracking_id,
                recipientName: shipment.recipient_name ?? "recipient",
                destination: shipment.destination_city ?? "",
            }).catch(() => { /* Non-fatal */ });
        }
    } else {
        // Generic status update SMS to the relevant party
        const notifyPhone = ["out_for_delivery", "at_hub"].includes(newStatus)
            ? shipment.recipient_phone
            : shipment.sender_phone;

        const notifyName = ["out_for_delivery", "at_hub"].includes(newStatus)
            ? (shipment.recipient_name ?? "Customer")
            : (shipment.sender_name ?? "Customer");

        if (notifyPhone) {
            sendStatusUpdateSMS({
                phone: notifyPhone,
                name: notifyName,
                trackingId: shipment.tracking_id,
                status: newStatus,
                location,
            }).catch(() => { /* Non-fatal */ });
        }
    }

    return { success: true, error: null };
}

/* ── Admin Overview Stats ────────────────────────────────────────
   Used by the admin dashboard home page.
──────────────────────────────────────────────────────────────── */
export async function getAdminStats(): Promise<{
    totalShipments: number;
    inTransit: number;
    delivered: number;
    failed: number;
    todayBookings: number;
    totalMessages: number;
    totalRevenue: number;
    totalVat: number;
    totalInsurance: number;
    totalBusinesses: number;
    totalUsers: number;
    pendingKYC: number;
    pendingSettlements: number;
}> {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [
        { count: total },
        { count: transit },
        { count: delivered },
        { count: failed },
        { count: todayCount },
        { count: messages },
        { count: businesses },
        { count: users },
        { count: kyc },
        { count: settlements },
        { data: transactions },
    ] = await Promise.all([
        (supabase as any).from("shipments").select("*", { count: "exact", head: true }),
        (supabase as any).from("shipments").select("*", { count: "exact", head: true }).in("status", ["in_transit", "collected", "at_hub", "out_for_delivery"]),
        (supabase as any).from("shipments").select("*", { count: "exact", head: true }).eq("status", "delivered"),
        (supabase as any).from("shipments").select("*", { count: "exact", head: true }).eq("status", "failed"),
        (supabase as any).from("shipments").select("*", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00Z`),
        (supabase as any).from("contact_messages").select("*", { count: "exact", head: true }).eq("read", false),
        (supabase as any).from("profiles").select("*", { count: "exact", head: true }).eq("account_type", "business"),
        (supabase as any).from("profiles").select("*", { count: "exact", head: true }),
        (supabase as any).from("profiles").select("*", { count: "exact", head: true }).eq("account_type", "business").eq("kyc_status", "pending"),
        (supabase as any).from("settlements").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("wallet_transactions").select("amount, metadata").eq("status", "success").eq("type", "debit"),
    ]);

    let revenue = 0;
    let vat = 0;
    let insurance = 0;

    (transactions || []).forEach((t: any) => {
        if (t.metadata?.logistics_base) {
            revenue += Number(t.metadata.logistics_base);
            vat += Number(t.metadata.vat_amount || 0);
            insurance += Number(t.metadata.insurance_premium || 0);
        } else {
            // Fallback for older transactions or simple debits
            revenue += Number(t.amount || 0);
        }
    });

    return {
        totalShipments: total ?? 0,
        inTransit: transit ?? 0,
        delivered: delivered ?? 0,
        failed: failed ?? 0,
        todayBookings: todayCount ?? 0,
        totalMessages: messages ?? 0,
        totalRevenue: Math.round(revenue),
        totalVat: Math.round(vat),
        totalInsurance: Math.round(insurance),
        totalBusinesses: businesses ?? 0,
        totalUsers: users ?? 0,
        pendingKYC: kyc ?? 0,
        pendingSettlements: settlements ?? 0,
    };
}

export async function updateMerchantKYC(userId: string, status: "verified" | "rejected" | "pending"): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any)
        .from("profiles")
        .update({ kyc_status: status })
        .eq("id", userId);

    if (error) return { success: false, error: "Update failed" };
    return { success: true, error: null };
}

/* ── Rider Fleet Management ────────────────────────────────── */
export async function getFleetStats() {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [
        { count: total },
        { count: active },
        { count: transit },
        { data: performance }
    ] = await Promise.all([
        (supabase as any).from("riders").select("*", { count: "exact", head: true }),
        (supabase as any).from("riders").select("*", { count: "exact", head: true }).eq("status", "active"),
        (supabase as any).from("riders").select("*", { count: "exact", head: true }).eq("status", "on_delivery"),
        (supabase as any).from("riders").select("rating, total_deliveries")
    ]);

    const avgRating = (performance || []).reduce((acc: number, r: any) => acc + Number(r.rating), 0) / (total || 1);

    return {
        totalRiders: total ?? 0,
        activeRiders: active ?? 0,
        ridersInTransit: transit ?? 0,
        avgFleetRating: avgRating.toFixed(1),
        fleetHealth: Math.round(((active ?? 0) / (total || 1)) * 100)
    };
}

export async function getRiders(search = "", status = "") {
    const supabase = await createServerSupabaseClient();
    let query = (supabase as any).from("riders").select("*").order("rating", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (search) query = query.ilike("full_name", `%${search}%`);

    const { data } = await query;
    return data || [];
}

export async function assignRiderToShipment(shipmentId: string, riderId: string) {
    const supabase = await createServerSupabaseClient();

    // 1. Get Rider Details
    const { data: rider } = await (supabase as any).from("riders").select("*").eq("id", riderId).single();
    if (!rider) return { success: false, error: "Rider not found" };

    // 2. Update Shipment
    const { error: shipErr } = await (supabase as any).from("shipments").update({
        rider_id: riderId,
        rider_name: rider.full_name,
        rider_phone: rider.phone,
        status: "collected" // Move to collected when rider is assigned/collects
    }).eq("id", shipmentId);

    if (shipErr) return { success: false, error: "Assignment failed" };

    // 3. Update Rider Status
    await (supabase as any).from("riders").update({ status: "on_delivery" }).eq("id", riderId);

    return { success: true, error: null };
}
