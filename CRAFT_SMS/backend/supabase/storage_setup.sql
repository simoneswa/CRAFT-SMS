-- CRAFT SMS - Storage Setup
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add Storage Policies for the bucket

-- Allow public read access to all images in payment-slips bucket
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-slips');

-- Allow authenticated users to upload slips (e.g. Students)
CREATE POLICY "Authenticated users can upload slips" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'payment-slips' 
    AND auth.role() = 'authenticated'
);

-- Note: We only allow inserts, not updates/deletes for immutable financial records
-- If updates are needed, you can add an UPDATE policy similarly.

-- 3. Modify the existing slips table to include image_url
-- Run this if the table already exists, otherwise the updated schema.sql will cover it
ALTER TABLE public.slips ADD COLUMN IF NOT EXISTS image_url TEXT;
