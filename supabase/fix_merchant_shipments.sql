-- Add user_id to shipments to link them to merchants
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
