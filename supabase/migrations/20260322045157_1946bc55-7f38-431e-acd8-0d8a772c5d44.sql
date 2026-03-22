UPDATE storage.buckets SET public = false WHERE id = 'scan-images';

DROP POLICY IF EXISTS "Anyone can view scan images" ON storage.objects;

CREATE POLICY "Users can view their own scan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);