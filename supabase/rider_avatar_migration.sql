-- Add avatar_url column to riders table
ALTER TABLE public.riders
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for rider avatars (run this too)
-- Supabase Dashboard → Storage → New Bucket
-- Name: rider-avatars | Public: true
-- OR via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('rider-avatars', 'rider-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Rider can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'rider-avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Rider avatar public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'rider-avatars');

CREATE POLICY "Rider can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'rider-avatars'
        AND auth.role() = 'authenticated'
    );
