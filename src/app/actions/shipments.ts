"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { TrackingEvent, Shipment } from "@/types/database";

/* ── Fetch a shipment + its events by tracking ID ───────────── */
export async function getShipmentByTrackingId(trackingId: string): Promise<{
    shipment: Shipment | null;
    events: TrackingEvent[];
    error: string | null;
}> {
    const supabase = await createServerSupabaseClient();

    const { data: shipment, error: shipError } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_id", trackingId.toUpperCase().trim())
        .single();

    if (shipError || !shipment) {
        return { shipment: null, events: [], error: "Shipment not found. Please check your tracking ID." };
    }

    const { data: events, error: eventsError } = await supabase
        .from("tracking_events")
        .select("*")
        .eq("tracking_id", trackingId.toUpperCase().trim())
        .order("sort_order", { ascending: true });

    return {
        shipment,
        events: events ?? [],
        error: eventsError ? "Could not load tracking events." : null,
    };
}

/* ── Submit contact form ─────────────────────────────────────── */
export async function submitContactMessage(data: {
    full_name: string;
    email: string;
    state?: string;
    service?: string;
    message?: string;
}): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from("contact_messages")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(data as any);

    if (error) return { success: false, error: "Failed to send message. Please try again." };
    return { success: true, error: null };
}

/* ── Submit business inquiry ─────────────────────────────────── */
export async function submitBusinessInquiry(data: {
    company_name?: string;
    contact_name: string;
    email: string;
    phone?: string;
    daily_volume?: string;
    message?: string;
}): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from("business_inquiries")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(data as any);

    if (error) return { success: false, error: "Failed to submit inquiry. Please try again." };
    return { success: true, error: null };
}
