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

/* ── Update shipment status from rider perspective ──────────── */
export async function riderUpdateStatus(
    shipmentId: string,
    newStatus: "in_transit" | "at_hub" | "out_for_delivery" | "delivered",
    location?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    // 1. Fetch shipment to get tracking_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipment } = await (supabase as any).from("shipments").select("tracking_id").eq("id", shipmentId).single();
    if (!shipment) return { success: false, error: "Shipment not found" };

    // 2. Update Shipment Status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: shipErr } = await (supabase as any)
        .from("shipments")
        .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...(newStatus === "delivered" ? { delivered_at: new Date().toISOString() } : {})
        })
        .eq("id", shipmentId);

    if (shipErr) return { success: false, error: shipErr.message };

    // 3. Synchronize Tracking Events Timeline
    const statusEventMap: Record<string, number> = {
        collected: 2,
        in_transit: 3,
        at_hub: 4,
        out_for_delivery: 5,
        delivered: 6,
    };
    const currentStep = statusEventMap[newStatus];

    if (currentStep) {
        // Mark all steps up to the previous as 'done'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("tracking_events")
            .update({ status: "done" })
            .eq("shipment_id", shipmentId)
            .lt("sort_order", currentStep);

        // Update the current step
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

    // 4. Handle Post-Delivery Actions
    if (newStatus === "delivered") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc("increment_rider_deliveries", { shipment_id: shipmentId })
            .catch(() => { /* Non-fatal */ });
    }

    return { success: true, error: null };
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

