"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { haversineKm, calculateBookingPrice } from "@/lib/pricing";

/* ─── Create a new on-demand booking ──────────────────────────── */
export async function createBookingRequest(data: {
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lng: number;
    package_description?: string;
    package_size: "small" | "medium" | "large" | "xl";
    estimated_weight_kg: number;
    receiver_name: string;
    receiver_phone: string;
    payment_method: "wallet" | "cash";
}): Promise<{ booking_id: string | null; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { booking_id: null, error: "Unauthorized" };

    // Verify it's a personal account
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

    if (profile?.account_type !== "personal") {
        return { booking_id: null, error: "On-demand booking is only available for personal accounts." };
    }

    // Calculate distance and price
    const distanceKm = haversineKm(
        data.pickup_lat, data.pickup_lng,
        data.dropoff_lat, data.dropoff_lng
    );
    const estimatedPrice = calculateBookingPrice(
        distanceKm,
        data.estimated_weight_kg,
        data.package_size
    );

    // If wallet payment, check balance
    if (data.payment_method === "wallet") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: wallet } = await (supabase as any)
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id)
            .single();

        if (!wallet || wallet.balance < estimatedPrice) {
            return {
                booking_id: null,
                error: `Insufficient wallet balance. You need ₦${estimatedPrice.toLocaleString()} but have ₦${(wallet?.balance ?? 0).toLocaleString()}.`
            };
        }
    }

    // Insert the booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error } = await (supabase as any)
        .from("booking_requests")
        .insert({
            customer_id: user.id,
            pickup_address: data.pickup_address,
            pickup_lat: data.pickup_lat,
            pickup_lng: data.pickup_lng,
            dropoff_address: data.dropoff_address,
            dropoff_lat: data.dropoff_lat,
            dropoff_lng: data.dropoff_lng,
            package_description: data.package_description,
            package_size: data.package_size,
            estimated_weight_kg: data.estimated_weight_kg,
            receiver_name: data.receiver_name,
            receiver_phone: data.receiver_phone,
            distance_km: Math.round(distanceKm * 100) / 100,
            estimated_price: estimatedPrice,
            payment_method: data.payment_method,
            status: "searching",
        })
        .select("id")
        .single();

    if (error || !booking) {
        console.error("[createBookingRequest]", error);
        return { booking_id: null, error: "Failed to create booking. Please try again." };
    }

    return { booking_id: booking.id, error: null };
}

/* ─── Get a single booking by ID ─────────────────────────────── */
export async function getBookingById(bookingId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("booking_requests")
        .select(`
            *,
            rider:rider_id (
                id, full_name, phone, vehicle_type,
                average_rating, is_online, current_lat, current_lng, avatar_url
            )
        `)
        .eq("id", bookingId)
        .single();

    return data ?? null;
}

/* ─── Get customer's booking history ─────────────────────────── */
export async function getMyBookings(limit = 20) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("booking_requests")
        .select(`
            *,
            rider:rider_id (
                id, full_name, phone, vehicle_type, average_rating, avatar_url
            )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    return data ?? [];
}

/* ─── Cancel a booking ───────────────────────────────────────── */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking } = await (supabase as any)
        .from("booking_requests")
        .select("status, customer_id")
        .eq("id", bookingId)
        .single();

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.customer_id !== user.id) return { success: false, error: "Unauthorized" };
    if (!["searching", "accepted"].includes(booking.status)) {
        return { success: false, error: "Cannot cancel once rider has picked up the package." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("booking_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

/* ─── Rate a completed booking ───────────────────────────────── */
export async function rateBooking(
    bookingId: string,
    rating: number,
    comment?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking } = await (supabase as any)
        .from("booking_requests")
        .select("status, customer_id, rider_id, customer_rating")
        .eq("id", bookingId)
        .single();

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.customer_id !== user.id) return { success: false, error: "Unauthorized" };
    if (booking.status !== "delivered") return { success: false, error: "Can only rate completed deliveries." };
    if (booking.customer_rating) return { success: false, error: "You have already rated this delivery." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from("booking_requests")
        .update({
            customer_rating: rating,
            customer_comment: comment ?? null,
            rating_given_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

    // Update rider's average rating
    if (booking.rider_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: ratingData } = await (supabase as any)
            .from("booking_requests")
            .select("customer_rating")
            .eq("rider_id", booking.rider_id)
            .not("customer_rating", "is", null);

        if (ratingData && ratingData.length > 0) {
            const avg = ratingData.reduce((s: number, r: { customer_rating: number }) => s + r.customer_rating, 0) / ratingData.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from("riders")
                .update({ average_rating: Math.round(avg * 100) / 100 })
                .eq("id", booking.rider_id);
        }
    }

    return { success: true, error: null };
}

/* ─── Get saved addresses ─────────────────────────────────────── */
export async function getSavedAddresses() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return data ?? [];
}

/* ─── Save an address ─────────────────────────────────────────── */
export async function saveAddress(data: {
    label: string;
    address: string;
    lat: number;
    lng: number;
}): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("saved_addresses")
        .insert({ user_id: user.id, ...data });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

/* ─── Delete a saved address ─────────────────────────────────── */
export async function deleteSavedAddress(addressId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("saved_addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

/* ─── RIDER: accept a booking ────────────────────────────────── */
export async function riderAcceptBooking(bookingId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rider } = await (supabase as any)
        .from("riders")
        .select("id, status")
        .eq("user_id", user.id)
        .single();

    if (!rider) return { success: false, error: "Rider not found" };
    if (rider.status === "on_delivery") return { success: false, error: "You already have an active delivery." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: success, error } = await (supabase as any).rpc("accept_booking_request", {
        p_booking_id: bookingId,
        p_rider_id: rider.id,
    });

    if (error || !success) return { success: false, error: error?.message ?? "Booking already taken. Try another one." };
    return { success: true, error: null };
}

/* ─── RIDER: update booking status ──────────────────────────── */
export async function riderUpdateBookingStatus(
    bookingId: string,
    newStatus: "rider_arriving" | "picked_up" | "in_transit" | "delivered",
    proofUrl?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rider } = await (supabase as any)
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!rider) return { success: false, error: "Rider not found" };

    if (newStatus === "delivered") {
        // Use the atomic RPC for completion + earnings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: success, error } = await (supabase as any).rpc("complete_booking_delivery", {
            p_booking_id: bookingId,
            p_rider_id: rider.id,
            p_proof_url: proofUrl ?? null,
        });
        if (error || !success) return { success: false, error: error?.message ?? "Failed to complete delivery." };
        return { success: true, error: null };
    }

    const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    };
    if (newStatus === "picked_up") updates.picked_up_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("booking_requests")
        .update(updates)
        .eq("id", bookingId)
        .eq("rider_id", rider.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
}

/* ─── RIDER: get open (searching) bookings nearby ────────────── */
export async function getOpenBookings() {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("booking_requests")
        .select("*")
        .eq("status", "searching")
        .order("created_at", { ascending: true })
        .limit(20);

    return data ?? [];
}

/* ─── RIDER: get my active booking ───────────────────────────── */
export async function getRiderActiveBooking() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rider } = await (supabase as any)
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!rider) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("booking_requests")
        .select("*")
        .eq("rider_id", rider.id)
        .in("status", ["accepted", "rider_arriving", "picked_up", "in_transit"])
        .order("accepted_at", { ascending: false })
        .limit(1)
        .single();

    return data ?? null;
}
