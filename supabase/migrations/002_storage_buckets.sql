-- ============================================================================
-- CircuLink: Supabase Storage Buckets & Policies
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================================

-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings',
  'listings',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings'
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view listing photos (public bucket)
CREATE POLICY "Anyone can view listing photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow factory owners to delete their own photos
CREATE POLICY "Factory owners can delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings'
  AND (storage.foldername(name))[1] = 'listing_photos'
  AND auth.uid() IS NOT NULL
);
