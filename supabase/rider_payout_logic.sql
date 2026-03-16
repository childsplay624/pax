-- ================================================================
-- 🛡️ PAN AFRICAN EXPRESS — RIDER PAYOUT & EARNINGS LOGIC
-- ================================================================

-- 1. Create a function to credit rider earnings atomically
CREATE OR REPLACE FUNCTION public.credit_rider_earnings(
    p_user_id UUID,
    p_amount  NUMERIC,
    p_shipment_id UUID,
    p_tracking_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Increment Wallet Balance (Upsert)
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET
        balance    = public.wallets.balance + EXCLUDED.balance,
        updated_at = now();

    -- 2. Log Earning Transaction
    INSERT INTO public.wallet_transactions (
        user_id, 
        type, 
        amount, 
        description, 
        status, 
        metadata
    )
    VALUES (
        p_user_id, 
        'credit', 
        p_amount, 
        'Earnings for delivery: ' || p_tracking_id, 
        'success',
        jsonb_build_object(
            'shipment_id', p_shipment_id,
            'tracking_id', p_tracking_id,
            'category', 'rider_earning'
        )
    );
END;
$$;

-- 2. Create a function to safely initiate a payout request (debits wallet immediately)
CREATE OR REPLACE FUNCTION public.request_rider_payout(
    p_user_id UUID,
    p_amount  NUMERIC,
    p_bank_name TEXT,
    p_account_number TEXT,
    p_account_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    -- 1. Check & Lock Balance
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL OR v_balance < p_amount THEN
        RETURN FALSE; -- Insufficient funds
    END IF;

    -- 2. Debit Wallet
    UPDATE public.wallets 
    SET balance = balance - p_amount, 
        updated_at = now()
    WHERE user_id = p_user_id;

    -- 3. Create Transaction Record (Debit - Pending)
    INSERT INTO public.wallet_transactions (
        user_id, type, amount, description, status, metadata
    )
    VALUES (
        p_user_id, 
        'debit', 
        p_amount, 
        'Payout request to ' || p_bank_name, 
        'pending',
        jsonb_build_object(
            'category', 'rider_payout',
            'bank_name', p_bank_name,
            'account_number', p_account_number
        )
    );

    -- 4. Create Settlement Record for Admin
    INSERT INTO public.settlements (
        user_id, amount, bank_name, account_number, account_name, status
    )
    VALUES (
        p_user_id, p_amount, p_bank_name, p_account_number, p_account_name, 'pending'
    );

    RETURN TRUE;
END;
$$;
