-- ================================================================
-- 🛡️ PAN AFRICAN EXPRESS — CENTRALIZED SYSTEM LOGGING
-- ================================================================
-- Persists errors and system events for admin review.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    level       TEXT         NOT NULL CHECK (level IN ('info', 'warn', 'error', 'fatal')),
    message     TEXT         NOT NULL,
    context     JSONB,       -- Stores stack traces, user info, or metadata
    source      TEXT         NOT NULL, -- 'server_action', 'api', 'client', 'worker'
    user_id     UUID         REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexing for fast searches in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.system_logs(user_id);

-- Lockdown: Logs are strictly write-only for authenticated users, 
-- and read-only for Admins.
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only insert their own client logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all logs"
  ON public.system_logs FOR SELECT
  USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Function to prune old logs (older than 30 days) to save space
CREATE OR REPLACE FUNCTION public.prune_system_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.system_logs WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
