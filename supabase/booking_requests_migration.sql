-- ================================================================
-- PAN AFRICAN EXPRESS — ON-DEMAND BOOKING (UBER-LIKE) MIGRATION
-- ================================================================
-- Run AFTER main migration.sql and wallet_migration.sql
-- This is IDEMPOTENT — safe to run multiple times.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. BOOKING REQUESTS TABLE
--    Central contract between customer (personal) and rider
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id                    UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id           UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rider_id              UUID          REFERENCES public.riders(id) ON DELETE SET NULL,

  -- Pickup location
  pickup_address        TEXT          NOT NULL,
  pickup_lat            NUMERIC(10,7),
  pickup_lng            NUMERIC(10,7),

  -- Dropoff location
  dropoff_address       TEXT          NOT NULL,
  dropoff_lat           NUMERIC(10,7),
  dropoff_lng           NUMERIC(10,7),

  -- Package details
  package_description   TEXT,
  package_size          TEXT          NOT NULL DEFAULT 'small'
                          CHECK (package_size IN ('small','medium','large','xl')),
  estimated_weight_kg   NUMERIC(6,2)  DEFAULT 1,
  receiver_name         TEXT,
  receiver_phone        TEXT,

  -- Financials
  distance_km           NUMERIC(8,2),
  estimated_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_price           NUMERIC(10,2),
  payment_method        TEXT          NOT NULL DEFAULT 'wallet'
                          CHECK (payment_method IN ('wallet','cash')),

  -- Status lifecycle (Uber-style)
  status                TEXT          NOT NULL DEFAULT 'searching'
                          CHECK (status IN (
                            'searching',   -- customer waiting for rider
                            'accepted',    -- rider accepted the job
                            'rider_arriving', -- rider heading to pickup
                            'picked_up',   -- rider has the package
                            'in_transit',  -- on the way to dropoff
                            'delivered',   -- successfully delivered
                            'cancelled',   -- cancelled before pickup
                            'failed'       -- delivery attempt failed
                          )),

  -- Proof & rating
  proof_of_delivery_url TEXT,
  customer_rating       SMALLINT      CHECK (customer_rating BETWEEN 1 AND 5),
  customer_comment      TEXT,
  rating_given_at       TIMESTAMPTZ,

  -- Timestamps
  accepted_at           TIMESTAMPTZ,
  picked_up_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_customer_id  ON public.booking_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_rider_id     ON public.booking_requests(rider_id);
CREATE INDEX IF NOT EXISTS idx_booking_status       ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_created_at   ON public.booking_requests(created_at DESC);

-- Auto-update trigger
DROP TRIGGER IF EXISTS booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────────────────────
-- 2. SAVED ADDRESSES TABLE
--    Personal users' address book
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id          UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,    -- "Home", "Office", "Mum's Place" etc.
  address     TEXT    NOT NULL,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);


-- ────────────────────────────────────────────────────────────────
-- 3. ALTER RIDERS TABLE — add online/location fields
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS is_online       BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS current_lat     NUMERIC(10,7);
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS current_lng     NUMERIC(10,7);
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS average_rating  NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS avatar_url      TEXT;

-- Index for finding online riders
CREATE INDEX IF NOT EXISTS idx_riders_is_online ON public.riders(is_online) WHERE is_online = TRUE;


-- ────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses  ENABLE ROW LEVEL SECURITY;

-- ── Booking Requests policies ─────────────────────────────────

-- Customer can see their own bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Customer can read own bookings') THEN
    CREATE POLICY "Customer can read own bookings"
      ON public.booking_requests FOR SELECT
      USING (auth.uid() = customer_id);
  END IF;
END $$;

-- Customer can create a booking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Customer can create booking') THEN
    CREATE POLICY "Customer can create booking"
      ON public.booking_requests FOR INSERT
      WITH CHECK (auth.uid() = customer_id);
  END IF;
END $$;

-- Customer can cancel their own booking (update limited fields)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Customer can update own booking') THEN
    CREATE POLICY "Customer can update own booking"
      ON public.booking_requests FOR UPDATE
      USING (auth.uid() = customer_id);
  END IF;
END $$;

-- Riders can see searching bookings (to accept them)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Riders can see searching bookings') THEN
    CREATE POLICY "Riders can see searching bookings"
      ON public.booking_requests FOR SELECT
      USING (
        status = 'searching' OR rider_id = (
          SELECT id FROM public.riders WHERE user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- Riders can update bookings assigned to them
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Rider can update assigned booking') THEN
    CREATE POLICY "Rider can update assigned booking"
      ON public.booking_requests FOR UPDATE
      USING (
        rider_id = (SELECT id FROM public.riders WHERE user_id = auth.uid() LIMIT 1)
        OR status = 'searching'
      );
  END IF;
END $$;

-- Admin can see all bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Admin can read all bookings') THEN
    CREATE POLICY "Admin can read all bookings"
      ON public.booking_requests FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'admin')
      );
  END IF;
END $$;

-- ── Saved Addresses policies ──────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_addresses' AND policyname = 'User can manage own addresses') THEN
    CREATE POLICY "User can manage own addresses"
      ON public.saved_addresses FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────
-- 5. RPC: accept_booking_request
--    Atomically assigns a rider to a booking (prevents race conditions)
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_booking_request(
  p_booking_id UUID,
  p_rider_id   UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Lock the row
  SELECT status INTO v_status
  FROM public.booking_requests
  WHERE id = p_booking_id
  FOR UPDATE;

  -- Only accept if still searching
  IF v_status IS NULL OR v_status != 'searching' THEN
    RETURN FALSE;
  END IF;

  -- Assign rider
  UPDATE public.booking_requests
  SET
    rider_id    = p_rider_id,
    status      = 'accepted',
    accepted_at = now(),
    updated_at  = now()
  WHERE id = p_booking_id;

  -- Mark rider as on_delivery
  UPDATE public.riders
  SET status     = 'on_delivery',
      updated_at = now()
  WHERE id = p_rider_id;

  RETURN TRUE;
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- 6. RPC: complete_booking_delivery
--    Atomically marks a booking delivered and credits rider earnings
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_booking_delivery(
  p_booking_id UUID,
  p_rider_id   UUID,
  p_proof_url  TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking   RECORD;
  v_rider_uid UUID;
  v_earning   NUMERIC := 0;
BEGIN
  SELECT * INTO v_booking FROM public.booking_requests WHERE id = p_booking_id AND rider_id = p_rider_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Mark delivered
  UPDATE public.booking_requests
  SET status              = 'delivered',
      final_price         = estimated_price,
      proof_of_delivery_url = p_proof_url,
      delivered_at        = now(),
      updated_at          = now()
  WHERE id = p_booking_id;

  -- Set rider back to active
  UPDATE public.riders
  SET status = 'active', updated_at = now()
  WHERE id = p_rider_id;

  -- Credit rider earnings (70% of booking price)
  v_earning := ROUND(v_booking.estimated_price * 0.70, 2);

  SELECT user_id INTO v_rider_uid FROM public.riders WHERE id = p_rider_id;

  IF v_rider_uid IS NOT NULL AND v_earning > 0 THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (v_rider_uid, v_earning)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = public.wallets.balance + EXCLUDED.balance, updated_at = now();

    INSERT INTO public.wallet_transactions (user_id, type, amount, description, status)
    VALUES (v_rider_uid, 'credit', v_earning, 'On-demand delivery earnings - ' || p_booking_id::TEXT, 'success');
  END IF;

  -- Debit customer wallet (if wallet payment)
  IF v_booking.payment_method = 'wallet' THEN
    UPDATE public.wallets
    SET balance = balance - v_booking.estimated_price, updated_at = now()
    WHERE user_id = v_booking.customer_id
      AND balance >= v_booking.estimated_price;

    INSERT INTO public.wallet_transactions (user_id, type, amount, description, status)
    VALUES (v_booking.customer_id, 'debit', v_booking.estimated_price, 'On-demand delivery payment - ' || p_booking_id::TEXT, 'success');
  END IF;

  RETURN TRUE;
END;
$$;


-- ================================================================
-- ✅ BOOKING MIGRATION COMPLETE
-- ================================================================
-- New Tables:
--   • public.booking_requests  — on-demand delivery contracts
--   • public.saved_addresses   — personal user address book
--
-- New Columns on public.riders:
--   • is_online, current_lat, current_lng, average_rating, avatar_url
--
-- New RPCs:
--   • accept_booking_request()    — atomic rider assignment
--   • complete_booking_delivery() — delivery completion + earnings
-- ================================================================
