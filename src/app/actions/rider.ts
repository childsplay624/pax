"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

/* ── Get the authenticated rider profile ─────────────────────── */
export async function getRiderProfile() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Riders log in via auth, their profile is in `riders` table by user_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rider } = await (supabase as any)
        .from("riders")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return rider ?? null;
}

/* ── Toggle Rider Active Status ──────────────────────────────── */
export async function setRiderStatus(
    riderId: string,
    status: "active" | "resting" | "offline"
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("riders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", riderId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

/* ── Get Active Dispatch Queue (shipments assigned to rider) ──── */
export async function getRiderDispatch(riderId: string) {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("shipments")
        .select("*")
        .eq("rider_id", riderId)
        .in("status", ["collected", "in_transit", "at_hub", "out_for_delivery"])
        .order("created_at", { ascending: false });

    return data ?? [];
}

/* ── Get Rider Earnings & Delivery History ───────────────────── */
export async function getRiderStats(riderId: string) {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [{ data: completed }, { data: today }] = await Promise.all([
        (supabase as any)
            .from("shipments")
            .select("id, created_at, service_type, declared_value, recipient_state, sender_state, status")
            .eq("rider_id", riderId)
            .eq("status", "delivered")
            .order("created_at", { ascending: false })
            .limit(20),
        (supabase as any)
            .from("shipments")
            .select("id, status")
            .eq("rider_id", riderId)
            .gte("created_at", new Date().toISOString().slice(0, 10) + "T00:00:00Z"),
    ]);

    const totalDeliveries = (completed ?? []).length;
    // Estimated earnings: flat rate per drop based on service type
    const RATE: Record<string, number> = {
        same_day: 1200,
        express: 1000,
        standard: 800,
        bulk: 600,
    };
    const weeklyEarnings = (completed ?? [])
        .filter((s: any) => {
            const d = new Date(s.created_at);
            const now = new Date();
            const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        })
        .reduce((acc: number, s: any) => acc + (RATE[s.service_type] ?? 800), 0);

    const todayDrops = (today ?? []).filter((s: any) => s.status === "delivered").length;

    return {
        totalDeliveries,
        weeklyEarnings,
        todayDrops,
        history: completed ?? [],
    };
}

import { triggerNotification } from "@/app/actions/notifications";

/* ── Update shipment status from rider perspective ──────────── */
export async function riderUpdateStatus(
    shipmentId: string,
    newStatus: "in_transit" | "at_hub" | "out_for_delivery" | "delivered",
    location?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch shipment details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipment } = await (supabase as any)
        .from("shipments")
        .select("*")
        .eq("id", shipmentId)
        .single();
    if (!shipment) return { success: false, error: "Shipment not found" };

    // 2. Handle OTP generation for "Out for Delivery"
    let otp = shipment.delivery_otp;
    if (newStatus === "out_for_delivery" && !otp) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 3. Update Shipment Status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: shipErr } = await (supabase as any)
        .from("shipments")
        .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...(newStatus === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
            ...(otp ? { delivery_otp: otp } : {})
        })
        .eq("id", shipmentId);

    if (shipErr) return { success: false, error: shipErr.message };

    // 4. Synchronize Tracking Events Timeline
    const statusEventMap: Record<string, number> = {
        collected: 2,
        in_transit: 3,
        at_hub: 4,
        out_for_delivery: 5,
        delivered: 6,
    };
    const currentStep = statusEventMap[newStatus];

    if (currentStep) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("tracking_events")
            .update({ status: "done" })
            .eq("shipment_id", shipmentId)
            .lt("sort_order", currentStep);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("tracking_events")
            .update({
                status: newStatus === "delivered" ? "done" : "current",
                event_location: location || undefined,
                event_date: new Date().toISOString().slice(0, 10),
                event_time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
            })
            .eq("shipment_id", shipmentId)
            .eq("sort_order", currentStep);
    }

    // 5. Trigger Unified Notifications (Async)
    try {
        const statusLabels: Record<string, string> = {
            collected: "picked up",
            in_transit: "now in transit",
            at_hub: `at our ${location || "hub"}`,
            out_for_delivery: "out for delivery",
            delivered: "delivered successfully",
        };

        const label = statusLabels[newStatus] || newStatus;

        // Notify Sender (In-app + Push + SMS + WhatsApp)
        await triggerNotification(shipment.user_id || null, {
            title: `Shipment ${label.charAt(0).toUpperCase() + label.slice(1)}`,
            message: `Your parcel ${shipment.tracking_id} is ${label}.`,
            type: newStatus === "delivered" ? "success" : "info",
            url: `/tracking?id=${shipment.tracking_id}`,
            phone: shipment.sender_phone,
            smsMessage: `PAX Update — Hi ${shipment.sender_name.split(" ")[0]}, your parcel ${shipment.tracking_id} has been ${label}. Track: https://panafricanexpress.ng/tracking?id=${shipment.tracking_id}`,
            whatsappMessage: `PAX Update — Hi ${shipment.sender_name.split(" ")[0]}, your parcel *${shipment.tracking_id}* has been *${label}*. Track: https://panafricanexpress.ng/tracking?id=${shipment.tracking_id}`
        });

        // Notify Recipient ONLY on "Out for Delivery"
        if (newStatus === "out_for_delivery") {
            const recipientMsg = `Hi ${shipment.recipient_name.split(" ")[0]}, your PAX parcel is out for delivery today! Delivery to: ${shipment.recipient_address}. Your OTP: ${otp}. Track: https://panafricanexpress.ng/tracking?id=${shipment.tracking_id}`;
            await triggerNotification(null, {
                title: "Out for Delivery",
                message: "",
                type: "info",
                phone: shipment.recipient_phone,
                smsMessage: recipientMsg,
                whatsappMessage: recipientMsg
            });
        }

        if (newStatus === "delivered") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).rpc("increment_rider_deliveries", { shipment_id: shipmentId }).catch(() => { });
        }
    } catch (notifyErr) {
        console.error("[RiderStatus] Notification failed:", notifyErr);
    }

    return { success: true, error: null };
}

/* ── Verify Delivery OTP ─────────────────────────────────────── */
export async function verifyDeliveryOtp(
    shipmentId: string,
    inputOtp: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipment } = await (supabase as any)
        .from("shipments")
        .select("delivery_otp")
        .eq("id", shipmentId)
        .single();

    if (!shipment) return { success: false, error: "Shipment not found" };
    if (shipment.delivery_otp !== inputOtp) return { success: false, error: "Invalid OTP. Please check with the recipient." };

    // If OTP matches, mark as delivered
    return await riderUpdateStatus(shipmentId, "delivered");
}

/* ── Update Rider GPS Coordinates ───────────────────────────── */
export async function updateRiderLocation(
    riderId: string,
    lat: number,
    lng: number
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("riders")
        .update({
            last_lat: lat,
            last_lng: lng,
            last_location_update: new Date().toISOString()
        })
        .eq("id", riderId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

