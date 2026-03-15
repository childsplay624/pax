-- ================================================================
-- PAN AFRICAN EXPRESS — RIDER REAL-TIME GEOLOCATION
-- ================================================================

-- 1. Add coordinates to riders table
ALTER TABLE public.riders 
  ADD COLUMN IF NOT EXISTS last_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS last_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- 2. Ensure riders can update their own location
-- We might need to check existing policies.
-- In rider_auth_migration.sql, there is already "Rider can update own profile"
-- but let's make sure it's robust.

DROP POLICY IF EXISTS "Rider can update own location" ON public.riders;
CREATE POLICY "Rider can update own location"
    ON public.riders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
