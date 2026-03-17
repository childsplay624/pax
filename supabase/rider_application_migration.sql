-- ================================================================
-- PAN AFRICAN EXPRESS — RIDER APPLICATION & KYC
-- ================================================================

-- 1. Create rider_applications table
CREATE TABLE IF NOT EXISTS public.rider_applications (
    id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name         TEXT         NOT NULL,
    email             TEXT         NOT NULL,
    phone             TEXT         NOT NULL,
    address           TEXT         NOT NULL,
    city              TEXT         NOT NULL,
    state             TEXT         NOT NULL,
    vehicle_type      TEXT         NOT NULL CHECK (vehicle_type IN ('bike', 'van', 'truck', 'drone')),
    vehicle_reg_number TEXT,
    id_type           TEXT         NOT NULL, -- e.g., NIN, Driver's License, International Passport
    id_number         TEXT         NOT NULL,
    id_image_url      TEXT,        -- URL to the uploaded ID image
    status            TEXT         NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id) -- One application per user for now
);

-- 2. Add kyc_status to profiles (if not already there, for general visibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified';

-- 3. Enable RLS
ALTER TABLE public.rider_applications ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Users can view their own application" ON public.rider_applications;
CREATE POLICY "Users can view their own application"
    ON public.rider_applications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own application" ON public.rider_applications;
CREATE POLICY "Users can create their own application"
    ON public.rider_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all rider applications" ON public.rider_applications;
CREATE POLICY "Admins can manage all rider applications"
    ON public.rider_applications FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.account_type = 'admin'
      )
    );

-- 5. Auto-update updated_at trigger
DROP TRIGGER IF EXISTS rider_applications_updated_at ON public.rider_applications;
CREATE TRIGGER rider_applications_updated_at
  BEFORE UPDATE ON public.rider_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
