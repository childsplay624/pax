-- ================================================================
-- PAN AFRICAN EXPRESS — RIDER ROLE & AUTH SYNC
-- ================================================================

-- 1. Update the profiles table to allow 'rider' as an account_type
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check 
  CHECK (account_type IN ('personal', 'business', 'admin', 'rider'));

-- 2. Link rider user metadata (if any existing riders aren't marked correctly)
-- This is manual, but good to have a record.
-- UPDATE public.profiles SET account_type = 'rider' WHERE id IN (SELECT user_id FROM public.riders WHERE user_id IS NOT NULL);

-- 3. Create a trigger to auto-set metadata or profile type if someone is added to riders
-- (Optional, but helps keep things in sync)
