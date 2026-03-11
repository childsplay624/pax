-- ================================================================
-- PAN AFRICAN EXPRESS — RIDER FLEET & AI DISPATCH MIGRATION
-- ================================================================

-- 1. RIDERS TABLE (The Fleet)
CREATE TABLE IF NOT EXISTS public.riders (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name     TEXT         NOT NULL,
  phone         TEXT         NOT NULL UNIQUE,
  vehicle_type  TEXT         NOT NULL CHECK (vehicle_type IN ('bike', 'van', 'truck', 'drone')),
  status        TEXT         NOT NULL DEFAULT 'active' 
                  CHECK (status IN ('active', 'on_delivery', 'resting', 'offline')),
  current_city  TEXT,
  rating        NUMERIC(2,1)  DEFAULT 5.0,
  total_deliveries INTEGER   DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Link Shipments to Riders
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL;

-- 3. RLS for Fleet
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view riders"
  ON public.riders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage riders"
  ON public.riders FOR ALL
  USING (auth.role() = 'authenticated');

-- 4. SEED SAMPLE FLEET
INSERT INTO public.riders (full_name, phone, vehicle_type, status, current_city, rating, total_deliveries)
VALUES 
('Kunle Adeyemi', '+234 807 003 0003', 'bike', 'active', 'Lagos', 4.9, 1240),
('Chidi Nwosu', '+234 814 005 0005', 'van', 'on_delivery', 'Port Harcourt', 4.8, 850),
('Amina Yusuf', '+234 901 000 1111', 'bike', 'resting', 'Kano', 5.0, 310),
('Segun Arinze', '+234 703 222 3333', 'truck', 'active', 'Ibadan', 4.7, 2100)
ON CONFLICT (phone) DO NOTHING;
