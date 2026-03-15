"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function trackShipment(trackingId: string) {
    if (!trackingId) return { shipment: null, events: [], error: "No tracking ID provided" };

    // We can use the standard client because get_tracking_data is a SECURITY DEFINER
    // postgres function, which bypasses RLS on the shipments and tracking_events tables.
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_tracking_data', { p_tracking_id: trackingId });

    if (error || !data) {
        return { shipment: null, events: [], error: error?.message || "Tracking data not found" };
    }

    // The RPC returns a JSON object with 'shipment' and 'events' keys
    return {
        shipment: data.shipment,
        events: data.events || [],
        error: null
    };
}
