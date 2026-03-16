-- ================================================================
-- 🛡️ PAN AFRICAN EXPRESS — SECURITY LOCKDOWN MIGRATION
-- ================================================================
-- This script fixes critical RLS vulnerabilities and data leaks.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. Create a bulletproof Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (account_type = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. WALLET LOCKDOWN ──────────────────────────────────────────
-- Disable all direct manipulation of funds from the client side.

ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own wallet" ON public.wallets;
CREATE POLICY "Owner can read own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can update wallet balance" ON public.wallets;
-- Implicitly: Only Service Role/Admin can write because no other policy allows it.

ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own transactions" ON public.wallet_transactions;
CREATE POLICY "Owner can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert transactions" ON public.wallet_transactions;

-- ─── 3. SHIPMENT & TRACKING LOCKDOWN ────────────────────────────
-- Force shipment creation and tracking updates through Server Actions.

DROP POLICY IF EXISTS "Anyone can create a shipment" ON public.shipments;
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON public.tracking_events;

-- Only Allow authenticated users to see their OWN shipments
DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;
CREATE POLICY "Users can read own shipments"
  ON public.shipments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Allow Admins and assigned Riders to update shipments
DROP POLICY IF EXISTS "Authenticated users can update shipments" ON public.shipments;
CREATE POLICY "Authorized roles can update shipments"
  ON public.shipments FOR UPDATE
  USING (
    public.is_admin() OR 
    (SELECT EXISTS (SELECT 1 FROM public.riders WHERE user_id = auth.uid() AND id = shipments.rider_id))
  );

-- ─── 4. DATA PRIVACY (PII REDACTION) ────────────────────────────
-- Update the tracking function to hide sensitive contact details.

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
    SELECT row_to_json(s) INTO v_shipment
    FROM (
        SELECT 
            ship.id, ship.tracking_id, ship.status, ship.service_type, ship.created_at, 
            ship.estimated_delivery, ship.origin_city, ship.destination_city,
            -- REDACTED FOR PRIVACY
            public.mask_name(ship.sender_name) as sender_name,
            ship.sender_state,
            public.mask_name(ship.recipient_name) as recipient_name,
            ship.recipient_state,
            ship.weight_kg, ship.declared_value, ship.rider_name,
            -- PROTECT RIDER PHONE
            CASE WHEN ship.status = 'out_for_delivery' THEN ship.rider_phone ELSE NULL END as rider_phone,
            r.last_lat, r.last_lng, r.last_location_update
        FROM shipments ship
        LEFT JOIN riders r ON ship.rider_id = r.id
        WHERE ship.tracking_id = p_tracking_id
        LIMIT 1
    ) s;

    IF v_shipment IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT json_agg(row_to_json(e)) INTO v_events
    FROM (
        SELECT id, tracking_id, status, event_title, event_location, event_description, event_date, event_time, sort_order
        FROM tracking_events
        WHERE tracking_id = p_tracking_id
        ORDER BY sort_order ASC
    ) e;

    RETURN jsonb_build_object(
        'shipment', v_shipment,
        'events', COALESCE(v_events, '[]'::jsonb)
    );
END;
$$;

-- Helper for masking names (e.g., "John Doe" -> "J*** D***")
CREATE OR REPLACE FUNCTION public.mask_name(val TEXT)
RETURNS TEXT AS $$
BEGIN
  IF val IS NULL OR val = '' THEN RETURN 'Customer'; END IF;
  RETURN regexp_replace(val, '(\w)\w+', '\1***', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── 5. PROFILE PRIVACY ──────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- ================================================================
-- ✅ SECURITY LOCKDOWN COMPLETE
-- Wallet funds are now server-side ONLY.
-- PII is redacted for public tracking.
-- Shipments are protected from unauthorized injection.
-- ================================================================
