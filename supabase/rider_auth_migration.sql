-- ================================================================
-- PAN AFRICAN EXPRESS — RIDER HUB AUTH MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Add user_id to riders table so riders can log in via Supabase Auth
ALTER TABLE public.riders
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders(user_id);

-- 2. Add delivered_at timestamp field (used when rider marks delivered)
ALTER TABLE public.shipments
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 3. RLS policy: rider can only see their own rows
DROP POLICY IF EXISTS "Rider can view own profile" ON public.riders;
CREATE POLICY "Rider can view own profile"
    ON public.riders FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Rider can update own profile" ON public.riders;
CREATE POLICY "Rider can update own profile"
    ON public.riders FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Helper function to increment rider delivery count on confirmed delivery
CREATE OR REPLACE FUNCTION public.increment_rider_deliveries(shipment_id UUID)
RETURNS VOID AS $$
DECLARE
    v_rider_id UUID;
BEGIN
    SELECT rider_id INTO v_rider_id FROM public.shipments WHERE id = shipment_id;
    IF v_rider_id IS NOT NULL THEN
        UPDATE public.riders
        SET total_deliveries = total_deliveries + 1,
            updated_at = now()
        WHERE id = v_rider_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. To link an existing rider to a Supabase auth user, run:
-- UPDATE public.riders SET user_id = '<auth-user-uuid>' WHERE phone = '<rider-phone>';
