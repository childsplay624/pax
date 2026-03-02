-- ============================================================
-- PAN African Express — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Enable UUID generation ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── SHIPMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id          TEXT        UNIQUE NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','confirmed','collected','in_transit','at_hub','out_for_delivery','delivered','failed')),
  service_type         TEXT        NOT NULL DEFAULT 'standard'
                         CHECK (service_type IN ('same_day','standard','express','bulk')),
  sender_name          TEXT,
  sender_phone         TEXT,
  sender_address       TEXT,
  sender_state         TEXT,
  recipient_name       TEXT,
  recipient_phone      TEXT,
  recipient_address    TEXT,
  recipient_state      TEXT,
  origin_city          TEXT,
  destination_city     TEXT,
  weight_kg            NUMERIC(6,2),
  declared_value       NUMERIC(10,2),
  insured              BOOLEAN     NOT NULL DEFAULT TRUE,
  special_instructions TEXT,
  estimated_delivery   TIMESTAMPTZ,
  rider_name           TEXT,
  rider_phone          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── TRACKING EVENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id       UUID        REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_id       TEXT        NOT NULL,
  event_title       TEXT        NOT NULL,
  event_location    TEXT,
  event_description TEXT,
  status            TEXT        NOT NULL DEFAULT 'upcoming'
                      CHECK (status IN ('done','current','upcoming')),
  event_date        DATE,
  event_time        TEXT,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON public.tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON public.tracking_events(shipment_id);

-- ─── CONTACT MESSAGES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name  TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  state      TEXT,
  service    TEXT,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── BUSINESS INQUIRIES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_inquiries (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT,
  daily_volume TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PROFILES (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  state        TEXT,
  account_type TEXT        NOT NULL DEFAULT 'personal'
                 CHECK (account_type IN ('personal','business')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.shipments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;

-- Shipments: publicly readable by tracking_id (no auth needed to track)
CREATE POLICY "Anyone can look up shipments by tracking_id"
  ON public.shipments FOR SELECT
  USING (true);

-- Tracking events: publicly readable (needed for track page)
CREATE POLICY "Anyone can read tracking events"
  ON public.tracking_events FOR SELECT
  USING (true);

-- Contact messages: anyone can insert (public-facing form)
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- Business inquiries: anyone can insert
CREATE POLICY "Anyone can submit a business inquiry"
  ON public.business_inquiries FOR INSERT
  WITH CHECK (true);

-- Profiles: users can only see and update their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── SEED DATA — demo shipment ───────────────────────────────
INSERT INTO public.shipments (
  tracking_id, status, service_type,
  sender_name, sender_phone, sender_address, sender_state,
  recipient_name, recipient_phone, recipient_address, recipient_state,
  origin_city, destination_city,
  weight_kg, declared_value, insured,
  estimated_delivery, rider_name, rider_phone
) VALUES (
  'PAX-738291', 'in_transit', 'express',
  'Amaka Obi', '+234 803 001 0001', '14 Adeola Odeku St, Victoria Island', 'Lagos',
  'Emeka Williams', '+234 802 002 0002', '22 Maitama Close, Garki', 'Abuja (FCT)',
  'Lagos', 'Abuja',
  2.1, 35000, TRUE,
  now() + INTERVAL '6 hours',
  'Kunle Adeyemi', '+234 807 003 0003'
) ON CONFLICT (tracking_id) DO NOTHING;

-- Seed tracking events for PAX-738291
WITH s AS (SELECT id FROM public.shipments WHERE tracking_id = 'PAX-738291')
INSERT INTO public.tracking_events (shipment_id, tracking_id, event_title, event_location, status, event_date, event_time, sort_order)
SELECT
  s.id, 'PAX-738291', title, location, st, edate::date, etime, sort
FROM s, (VALUES
  ('Order Confirmed',   'Lagos — Victoria Island Drop-off', 'done',     '2026-03-01'::date, '08:10 AM',      1),
  ('Collected by Rider','PAX Lagos HQ — Ikeja Sorting Hub', 'done',     '2026-03-01'::date, '10:35 AM',      2),
  ('In Transit',        'Ibadan — Tollgate Relay Centre',   'current',  '2026-03-01'::date, '01:14 PM',      3),
  ('Arrived at Hub',    'Abuja — Wuse II Depot',            'upcoming', '2026-03-01'::date, 'ETA 05:00 PM',  4),
  ('Out for Delivery',  'Garki, Abuja',                     'upcoming', '2026-03-01'::date, 'ETA 07:00 PM',  5),
  ('Delivered',         'Recipient Address',                'upcoming', NULL::date,         '—',             6)
) AS t(title, location, st, edate, etime, sort)
ON CONFLICT DO NOTHING;

-- Seed for PAX-004421
INSERT INTO public.shipments (
  tracking_id, status, service_type,
  sender_name, sender_phone, sender_address, sender_state,
  recipient_name, recipient_phone, recipient_address, recipient_state,
  origin_city, destination_city,
  weight_kg, declared_value, insured,
  estimated_delivery, rider_name
) VALUES (
  'PAX-004421', 'out_for_delivery', 'same_day',
  'Tunde Adeyemi', '+234 806 004 0004', '5 Ring Rd, Ibadan', 'Oyo',
  'Yetunde Okafor', '+234 814 005 0005', '12 New GRA, Port Harcourt', 'Rivers',
  'Ibadan', 'Port Harcourt',
  0.8, 12000, TRUE,
  now() + INTERVAL '2 hours',
  'Chidi Nwosu'
) ON CONFLICT (tracking_id) DO NOTHING;

-- ============================================================
-- AMENDMENTS: Admin read access + shipment insert by anyone
-- Run this block separately if you already ran the main schema
-- ============================================================

-- Allow authenticated users (admin) to read contact messages and business inquiries
CREATE POLICY "Authenticated users can read contact messages"
  ON public.contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read business inquiries"
  ON public.business_inquiries FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow anyone to insert shipments (public booking flow)
CREATE POLICY "Anyone can create a shipment"
  ON public.shipments FOR INSERT
  WITH CHECK (true);

-- Allow anyone to insert tracking events (used by booking server action)
CREATE POLICY "Anyone can insert tracking events"
  ON public.tracking_events FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update shipments (admin status changes)
CREATE POLICY "Authenticated users can update shipments"
  ON public.shipments FOR UPDATE
  USING (auth.role() = 'authenticated');

