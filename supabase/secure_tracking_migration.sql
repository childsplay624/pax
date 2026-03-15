-- ================================================================
-- PAN AFRICAN EXPRESS — SECURE TRACKING & RLS LOCKDOWN
-- ================================================================

-- 1. Create a SECURITY DEFINER function to securely fetch tracking data
-- This allows anyone to fetch specific tracking details without
-- opening up the entire shipments/tracking_events tables to public read.
CREATE OR REPLACE FUNCTION public.get_tracking_data(p_tracking_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shipment JSONB;
    v_events JSONB;
BEGIN
    -- Fetch the shipment
    SELECT row_to_json(s) INTO v_shipment
    FROM (
        SELECT 
            ship.id, ship.tracking_id, ship.status, ship.service_type, ship.created_at, 
            ship.estimated_delivery, ship.origin_city, ship.destination_city,
            ship.sender_name, ship.sender_state, ship.recipient_name, ship.recipient_state,
            ship.weight_kg, ship.declared_value, ship.rider_name, ship.rider_phone,
            r.last_lat, r.last_lng, r.last_location_update
        FROM shipments ship
        LEFT JOIN riders r ON ship.rider_id = r.id
        WHERE ship.tracking_id = p_tracking_id
        LIMIT 1
    ) s;

    IF v_shipment IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch the tracking events
    SELECT json_agg(row_to_json(e)) INTO v_events
    FROM (
        SELECT id, tracking_id, status, "location", "desc", status_time, sort_order, "status" as ev_status
        FROM tracking_events
        WHERE tracking_id = p_tracking_id
        ORDER BY sort_order ASC
    ) e;

    -- Return combined result
    RETURN jsonb_build_object(
        'shipment', v_shipment,
        'events', COALESCE(v_events, '[]'::jsonb)
    );
END;
$$;

-- 2. Lock down the RLS policies
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove the overly permissive public read policies (assuming they exist by these names)
DROP POLICY IF EXISTS "Public read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Public read tracking_events" ON public.tracking_events;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

-- Ensure users can read only their own data
DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;
CREATE POLICY "Users can read own shipments" ON public.shipments FOR SELECT USING (auth.uid() = user_id);
-- Wait, the `profiles` table likely already has "Users can read own profile".
-- Tracking events shouldn't be publicly readable directly from the table anymore, only via get_tracking_data RPC.
