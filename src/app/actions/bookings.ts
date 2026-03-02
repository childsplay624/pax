"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NIGERIAN_STATES } from "@/lib/pricing";

// Re-export for any existing imports from this path
export { NIGERIAN_STATES, calculatePrice } from "@/lib/pricing";

/* ── Generate unique PAX tracking ID ──────────────────────────  */
function generateTrackingId(): string {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `PAX-${num}`;
}

/* ── Create new shipment (booking) ───────────────────────────── */
export async function createShipment(data: {
    sender_name: string;
    sender_phone: string;
    sender_address: string;
    sender_state: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    recipient_state: string;
    origin_city: string;
    destination_city: string;
    weight_kg: number;
    declared_value: number;
    service_type: "standard" | "express" | "same_day" | "bulk";
    special_instructions?: string;
}): Promise<{ tracking_id: string | null; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const tracking_id = generateTrackingId();

    // Estimate delivery based on service type
    const hoursMap: Record<string, number> = {
        same_day: 8, express: 24, standard: 72, bulk: 120,
    };
    const estimated_delivery = new Date(
        Date.now() + (hoursMap[data.service_type] ?? 72) * 3600 * 1000
    ).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipment, error } = await (supabase.from("shipments") as any)
        .insert({
            tracking_id,
            status: "confirmed",
            service_type: data.service_type,
            sender_name: data.sender_name,
            sender_phone: data.sender_phone,
            sender_address: data.sender_address,
            sender_state: data.sender_state,
            recipient_name: data.recipient_name,
            recipient_phone: data.recipient_phone,
            recipient_address: data.recipient_address,
            recipient_state: data.recipient_state,
            origin_city: data.origin_city,
            destination_city: data.destination_city,
            weight_kg: data.weight_kg,
            declared_value: data.declared_value,
            insured: true,
            special_instructions: data.special_instructions,
            estimated_delivery,
        })
        .select("id, tracking_id")
        .single() as { data: { id: string; tracking_id: string } | null; error: unknown };

    if (error || !shipment) return { tracking_id: null, error: "Booking failed. Please try again." };

    // Seed initial tracking events
    const events = [
        { event_title: "Order Confirmed", event_location: `${data.origin_city}, ${data.sender_state}`, status: "done", sort_order: 1 },
        { event_title: "Awaiting Collection", event_location: "PAX Collection Hub", status: "current", sort_order: 2 },
        { event_title: "In Transit", event_location: "En route", status: "upcoming", sort_order: 3 },
        { event_title: "Arrived at Hub", event_location: `PAX ${data.destination_city} Depot`, status: "upcoming", sort_order: 4 },
        { event_title: "Out for Delivery", event_location: data.destination_city, status: "upcoming", sort_order: 5 },
        { event_title: "Delivered", event_location: data.recipient_address, status: "upcoming", sort_order: 6 },
    ] as any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("tracking_events") as any).insert(
        events.map((e: Record<string, unknown>) => ({
            shipment_id: shipment.id,
            tracking_id,
            event_date: new Date().toISOString().slice(0, 10),
            event_time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
            ...e,
        }))
    );

    return { tracking_id, error: null };
}

