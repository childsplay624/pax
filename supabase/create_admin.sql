-- ================================================================
-- PAN AFRICAN EXPRESS — ADMIN PROMOTION UTILITY (FIXED)
-- ================================================================
-- 1. Ensure the database constraint allows the 'admin' type
-- 2. Promote the user to admin
-- ================================================================

DO $$
BEGIN
    -- STEP A: Update the constraint if it still excludes 'admin'
    -- (The error you saw means the DB is still on the old schema)
    BEGIN
        ALTER TABLE public.profiles 
        DROP CONSTRAINT IF EXISTS profiles_account_type_check;
        
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_account_type_check 
        CHECK (account_type IN ('personal', 'business', 'admin'));
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Constraint update failed or already updated. Proceeding...';
    END;
END $$;

-- STEP B: Promote the user
DO $$
DECLARE
    target_id UUID;
BEGIN
    -- Find the User ID (Replace the email below with yours)
    SELECT id INTO target_id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

    IF target_id IS NOT NULL THEN
        -- 2. Update their account_type in public.profiles
        UPDATE public.profiles 
        SET account_type = 'admin' 
        WHERE id = target_id;

        -- 3. IMPORTANT: Update the auth metadata for middleware to work
        -- This ensures the 'admin' role is present in the JWT/session
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('account_type', 'admin')
        WHERE id = target_id;
        
        RAISE NOTICE 'User % has been successfully promoted to Admin and metadata synced.', target_id;
    ELSE
        RAISE EXCEPTION 'User email YOUR_EMAIL_HERE not found! Ensure the user has signed up first.';
    END IF;
END $$;
