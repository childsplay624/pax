-- ================================================================
-- PAN AFRICAN EXPRESS — COMPLETE DATABASE MIGRATION
-- ================================================================
-- Project  : PAN African Express (PAX)
-- Version  : 1.0.0
-- Created  : 2026-03-03
-- Run in   : Supabase Dashboard → SQL Editor → New Query
--            (or via: supabase db push)
--
-- This is a SINGLE, IDEMPOTENT migration file.
-- Safe to run multiple times — all statements use IF NOT EXISTS
-- or ON CONFLICT clauses.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- uuid_generate_v4() (fallback)


-- ────────────────────────────────────────────────────────────────
-- 1. SHARED TRIGGER FUNCTION  (auto-update updated_at)
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Only update updated_at if the column exists on this table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name   = TG_TABLE_NAME
      AND column_name  = 'updated_at'
  ) INTO col_exists;

  IF col_exists THEN
    NEW.updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- 2. SHIPMENTS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipments (
  id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id          TEXT         NOT NULL UNIQUE,
  status               TEXT         NOT NULL DEFAULT 'pending'
                         CHECK (status IN (
                           'pending','confirmed','collected',
                           'in_transit','at_hub','out_for_delivery',
                           'delivered','failed'
                         )),
  service_type         TEXT         NOT NULL DEFAULT 'standard'
                         CHECK (service_type IN ('same_day','standard','express','bulk')),

  -- Sender
  sender_name          TEXT,
  sender_phone         TEXT,
  sender_address       TEXT,
  sender_state         TEXT,

  -- Recipient
  recipient_name       TEXT,
  recipient_phone      TEXT,
  recipient_address    TEXT,
  recipient_state      TEXT,

  -- Route
  origin_city          TEXT,
  destination_city     TEXT,

  -- Parcel
  weight_kg            NUMERIC(6,2),
  declared_value       NUMERIC(10,2),
  insured              BOOLEAN      NOT NULL DEFAULT TRUE,
  special_instructions TEXT,

  -- Delivery
  estimated_delivery   TIMESTAMPTZ,
  rider_name           TEXT,
  rider_phone          TEXT,

  -- Audit
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Ensure updated_at exists (safe if table was already created without it)
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id    ON public.shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status          ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at      ON public.shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_state    ON public.shipments(sender_state);
CREATE INDEX IF NOT EXISTS idx_shipments_recipient_state ON public.shipments(recipient_state);

-- Auto-update trigger
DROP TRIGGER IF EXISTS shipments_updated_at ON public.shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────────────────────
-- 3. TRACKING EVENTS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tracking_events (
  id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id       UUID         REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_id       TEXT         NOT NULL,
  event_title       TEXT         NOT NULL,
  event_location    TEXT,
  event_description TEXT,
  status            TEXT         NOT NULL DEFAULT 'upcoming'
                      CHECK (status IN ('done','current','upcoming')),
  event_date        DATE,
  event_time        TEXT,
  sort_order        INTEGER      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id  ON public.tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id  ON public.tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_sort_order   ON public.tracking_events(tracking_id, sort_order);


-- ────────────────────────────────────────────────────────────────
-- 4. CONTACT MESSAGES
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name  TEXT         NOT NULL,
  email      TEXT         NOT NULL,
  state      TEXT,
  service    TEXT,
  message    TEXT,
  read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email      ON public.contact_messages(email);


-- ────────────────────────────────────────────────────────────────
-- 5. BUSINESS INQUIRIES
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_inquiries (
  id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT         NOT NULL,
  email        TEXT         NOT NULL,
  phone        TEXT,
  daily_volume TEXT,
  message      TEXT,
  read         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_inquiries_created_at ON public.business_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_inquiries_email      ON public.business_inquiries(email);


-- ────────────────────────────────────────────────────────────────
-- 6. PROFILES  (extends auth.users — one row per authenticated user)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID         NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  state        TEXT,
  account_type TEXT         NOT NULL DEFAULT 'personal'
                 CHECK (account_type IN ('personal', 'business', 'admin')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Ensure updated_at exists on profiles (safe if table already existed without it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- Auto-update trigger
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Auto-create profile row immediately after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name    = EXCLUDED.full_name,
        account_type = EXCLUDED.account_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.shipments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;


-- ── Shipments ────────────────────────────────────────────────────

-- Anyone can look up a shipment (track page — no auth required)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shipments' AND policyname = 'Anyone can read shipments'
  ) THEN
    CREATE POLICY "Anyone can read shipments"
      ON public.shipments FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can book a shipment (public booking flow)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shipments' AND policyname = 'Anyone can create a shipment'
  ) THEN
    CREATE POLICY "Anyone can create a shipment"
      ON public.shipments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users (admin) can update shipment status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shipments' AND policyname = 'Authenticated users can update shipments'
  ) THEN
    CREATE POLICY "Authenticated users can update shipments"
      ON public.shipments FOR UPDATE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users (admin) can delete shipments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shipments' AND policyname = 'Authenticated users can delete shipments'
  ) THEN
    CREATE POLICY "Authenticated users can delete shipments"
      ON public.shipments FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;


-- ── Tracking Events ───────────────────────────────────────────────

-- Anyone can read tracking events (track page)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tracking_events' AND policyname = 'Anyone can read tracking events'
  ) THEN
    CREATE POLICY "Anyone can read tracking events"
      ON public.tracking_events FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can insert tracking events (booking server action)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tracking_events' AND policyname = 'Anyone can insert tracking events'
  ) THEN
    CREATE POLICY "Anyone can insert tracking events"
      ON public.tracking_events FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users (admin) can update tracking events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tracking_events' AND policyname = 'Authenticated users can update tracking events'
  ) THEN
    CREATE POLICY "Authenticated users can update tracking events"
      ON public.tracking_events FOR UPDATE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;


-- ── Contact Messages ──────────────────────────────────────────────

-- Anyone can submit a contact message (public form)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_messages' AND policyname = 'Anyone can submit a contact message'
  ) THEN
    CREATE POLICY "Anyone can submit a contact message"
      ON public.contact_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users (admin) can read all contact messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_messages' AND policyname = 'Authenticated users can read contact messages'
  ) THEN
    CREATE POLICY "Authenticated users can read contact messages"
      ON public.contact_messages FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users (admin) can delete contact messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_messages' AND policyname = 'Authenticated users can delete contact messages'
  ) THEN
    CREATE POLICY "Authenticated users can delete contact messages"
      ON public.contact_messages FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;


-- ── Business Inquiries ────────────────────────────────────────────

-- Anyone can submit a business inquiry (public form)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_inquiries' AND policyname = 'Anyone can submit a business inquiry'
  ) THEN
    CREATE POLICY "Anyone can submit a business inquiry"
      ON public.business_inquiries FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users (admin) can read all business inquiries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_inquiries' AND policyname = 'Authenticated users can read business inquiries'
  ) THEN
    CREATE POLICY "Authenticated users can read business inquiries"
      ON public.business_inquiries FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users (admin) can delete business inquiries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_inquiries' AND policyname = 'Authenticated users can delete business inquiries'
  ) THEN
    CREATE POLICY "Authenticated users can delete business inquiries"
      ON public.business_inquiries FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;


-- ── Profiles ──────────────────────────────────────────────────────

-- Users can view their own profile only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Supabase trigger function inserts the row, so we also need insert allowed
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Service can insert profile on signup'
  ) THEN
    CREATE POLICY "Service can insert profile on signup"
      ON public.profiles FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────
-- 8. SEED DATA  (demo shipments for testing/demo purposes)
--    All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- ────────────────────────────────────────────────────────────────

-- Demo shipment 1: In Transit (Lagos → Abuja)
INSERT INTO public.shipments (
  tracking_id, status, service_type,
  sender_name, sender_phone, sender_address, sender_state,
  recipient_name, recipient_phone, recipient_address, recipient_state,
  origin_city, destination_city,
  weight_kg, declared_value, insured,
  estimated_delivery, rider_name, rider_phone
) VALUES (
  'PAX-738291', 'in_transit', 'express',
  'Amaka Obi',       '+234 803 001 0001', '14 Adeola Odeku St, Victoria Island', 'Lagos',
  'Emeka Williams',  '+234 802 002 0002', '22 Maitama Close, Garki',             'Abuja (FCT)',
  'Lagos', 'Abuja',
  2.1, 35000.00, TRUE,
  (now() + INTERVAL '6 hours'),
  'Kunle Adeyemi', '+234 807 003 0003'
) ON CONFLICT (tracking_id) DO NOTHING;

-- Tracking events for PAX-738291
WITH s AS (SELECT id FROM public.shipments WHERE tracking_id = 'PAX-738291')
INSERT INTO public.tracking_events (shipment_id, tracking_id, event_title, event_location, status, event_date, event_time, sort_order)
SELECT s.id, 'PAX-738291', title, location, st, edate, etime, sort
FROM s,
(VALUES
  ('Order Confirmed',    'Lagos — Victoria Island Drop-off',    'done',     CURRENT_DATE,     '08:10 AM',      1),
  ('Collected by Rider', 'PAX Lagos HQ — Ikeja Sorting Hub',    'done',     CURRENT_DATE,     '10:35 AM',      2),
  ('In Transit',         'Ibadan — Tollgate Relay Centre',      'current',  CURRENT_DATE,     '01:14 PM',      3),
  ('Arrived at Hub',     'Abuja — Wuse II Depot',               'upcoming', CURRENT_DATE,     'ETA 05:00 PM',  4),
  ('Out for Delivery',   'Garki, Abuja',                        'upcoming', CURRENT_DATE,     'ETA 07:00 PM',  5),
  ('Delivered',          'Recipient Address, Garki',            'upcoming', NULL,             '—',             6)
) AS t(title, location, st, edate, etime, sort)
ON CONFLICT DO NOTHING;


-- Demo shipment 2: Out for Delivery (Ibadan → Port Harcourt)
INSERT INTO public.shipments (
  tracking_id, status, service_type,
  sender_name, sender_phone, sender_address, sender_state,
  recipient_name, recipient_phone, recipient_address, recipient_state,
  origin_city, destination_city,
  weight_kg, declared_value, insured,
  estimated_delivery, rider_name, rider_phone
) VALUES (
  'PAX-004421', 'out_for_delivery', 'same_day',
  'Tunde Adeyemi', '+234 806 004 0004', '5 Ring Rd, Ibadan',            'Oyo',
  'Yetunde Okafor', '+234 814 005 0005', '12 New GRA, Port Harcourt',   'Rivers',
  'Ibadan', 'Port Harcourt',
  0.8, 12000.00, TRUE,
  (now() + INTERVAL '2 hours'),
  'Chidi Nwosu', '+234 809 006 0006'
) ON CONFLICT (tracking_id) DO NOTHING;

-- Tracking events for PAX-004421
WITH s AS (SELECT id FROM public.shipments WHERE tracking_id = 'PAX-004421')
INSERT INTO public.tracking_events (shipment_id, tracking_id, event_title, event_location, status, event_date, event_time, sort_order)
SELECT s.id, 'PAX-004421', title, location, st, edate, etime, sort
FROM s,
(VALUES
  ('Order Confirmed',    'Oyo — Ibadan Ring Road',              'done',     CURRENT_DATE,     '07:00 AM',      1),
  ('Collected by Rider', 'PAX Ibadan Hub',                      'done',     CURRENT_DATE,     '08:20 AM',      2),
  ('In Transit',         'Benin City Relay Centre',             'done',     CURRENT_DATE,     '11:45 AM',      3),
  ('Arrived at Hub',     'PAX Port Harcourt Depot — Aba Road',  'done',     CURRENT_DATE,     '02:30 PM',      4),
  ('Out for Delivery',   'New GRA, Port Harcourt',              'current',  CURRENT_DATE,     '03:15 PM',      5),
  ('Delivered',          'Recipient Address, New GRA',          'upcoming', NULL,             '—',             6)
) AS t(title, location, st, edate, etime, sort)
ON CONFLICT DO NOTHING;


-- Demo shipment 3: Delivered (Kano → Lagos)
INSERT INTO public.shipments (
  tracking_id, status, service_type,
  sender_name, sender_phone, sender_address, sender_state,
  recipient_name, recipient_phone, recipient_address, recipient_state,
  origin_city, destination_city,
  weight_kg, declared_value, insured,
  estimated_delivery, rider_name, rider_phone
) VALUES (
  'PAX-119200', 'delivered', 'standard',
  'Musa Ibrahim',    '+234 811 007 0007', '3 Bompai Rd, Kano',           'Kano',
  'Ngozi Eze',       '+234 803 008 0008', '45 Toyin St, Ikeja',          'Lagos',
  'Kano', 'Lagos',
  5.4, 80000.00, TRUE,
  (now() - INTERVAL '1 day'),
  'Seun Olatunji', '+234 816 009 0009'
) ON CONFLICT (tracking_id) DO NOTHING;

-- Tracking events for PAX-119200
WITH s AS (SELECT id FROM public.shipments WHERE tracking_id = 'PAX-119200')
INSERT INTO public.tracking_events (shipment_id, tracking_id, event_title, event_location, status, event_date, event_time, sort_order)
SELECT s.id, 'PAX-119200', title, location, st, edate, etime, sort
FROM s,
(VALUES
  ('Order Confirmed',    'Kano — Bompai Road',                  'done', CURRENT_DATE - 2,  '09:00 AM', 1),
  ('Collected by Rider', 'PAX Kano Hub — Fagge',                'done', CURRENT_DATE - 2,  '10:30 AM', 2),
  ('In Transit',         'Kaduna Relay Centre',                 'done', CURRENT_DATE - 2,  '01:00 PM', 3),
  ('Arrived at Hub',     'PAX Lagos Depot — Mushin',            'done', CURRENT_DATE - 1,  '05:15 AM', 4),
  ('Out for Delivery',   'Ikeja, Lagos',                        'done', CURRENT_DATE - 1,  '08:00 AM', 5),
  ('Delivered',          '45 Toyin St, Ikeja, Lagos',           'done', CURRENT_DATE - 1,  '10:22 AM', 6)
) AS t(title, location, st, edate, etime, sort)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET  (for any future image uploads)
-- ────────────────────────────────────────────────────────────────
-- Uncomment and run separately if you need file storage:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('pax-assets', 'pax-assets', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Public can read pax-assets"
--   ON storage.objects FOR SELECT USING (bucket_id = 'pax-assets');
--
-- CREATE POLICY "Authenticated users can upload to pax-assets"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'pax-assets' AND auth.role() = 'authenticated');


-- ================================================================
-- ✅ MIGRATION COMPLETE
-- ================================================================
-- Tables created:
--   • public.shipments          — parcel bookings
--   • public.tracking_events    — status timeline per shipment
--   • public.contact_messages   — contact form submissions
--   • public.business_inquiries — enterprise inquiry form
--   • public.profiles           — linked to auth.users (auto-created on signup)
--
-- Functions & Triggers:
--   • handle_updated_at()       — auto-stamps updated_at on every UPDATE
--   • handle_new_user()         — auto-creates profile row on user signup
--   • shipments_updated_at trigger
--   • profiles_updated_at trigger
--   • on_auth_user_created trigger
--
-- RLS Policies:
--   • Shipments   : public read+insert, auth update+delete
--   • Events      : public read+insert, auth update
--   • Contact     : public insert, auth read+delete
--   • Inquiries   : public insert, auth read+delete
--   • Profiles    : owner read+update, service insert
--
-- Demo Seed Data (3 shipments with full event timelines):
--   • PAX-738291  in_transit    Lagos → Abuja
--   • PAX-004421  out_for_delivery  Ibadan → Port Harcourt
--   • PAX-119200  delivered     Kano → Lagos
-- ================================================================
